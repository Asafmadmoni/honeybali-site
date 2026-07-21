/**
 * routing.js — decides ONE product from answers. Pure function, no UI, no DOM.
 * Reads routing.config.js + the effects accumulated in state.
 */
import ROUTING from '../config/routing.config.js?v=41';
import QUIZ_STEPS from '../config/quiz.config.js?v=41';

// Recompute score tallies from the raw answers (so it's deterministic on refresh).
function tallyScores(answers) {
  var score = { private: 0, signature: 0, visa: 0, explorer: 0 };
  var flags = {};
  var facts = {};
  QUIZ_STEPS.forEach(function (step) {
    if (!step.options) return;
    var chosen = answers[step.id];
    if (chosen == null) return;
    var ids = Array.isArray(chosen) ? chosen : [chosen];
    ids.forEach(function (id) {
      var opt = step.options.filter(function (o) { return o.id === id; })[0];
      if (!opt || !opt.effects) return;
      var e = opt.effects;
      if (e.score) Object.keys(e.score).forEach(function (k) { score[k] += e.score[k]; });
      if (e.flag) flags[e.flag] = true;
      if (e.set) Object.keys(e.set).forEach(function (k) { facts[k] = e.set[k]; });
    });
  });
  return { score: score, flags: flags, facts: facts };
}

function ruleMatches(when, ctx) {
  return Object.keys(when).every(function (k) {
    var expect = when[k];
    if (k === 'flag') return !!ctx.flags[expect];
    if (k === 'notWantsFullService') return !ctx.facts.wantsFullService === !!expect;
    // otherwise it's a fact equality (e.g. lodging: 'booked')
    return ctx.facts[k] === expect;
  });
}

/**
 * decide(answers) -> { package, reasonCodes[], score, facts }
 */
export function decide(answers) {
  var ctx = tallyScores(answers);
  var reasons = [];

  // 1) Priority rules first (explicit visa etc.)
  for (var i = 0; i < ROUTING.priorityRules.length; i++) {
    var rule = ROUTING.priorityRules[i];
    if (ruleMatches(rule.when, ctx)) {
      reasons.push(rule.reason);
      return finalize(rule.route, reasons, ctx);
    }
  }

  // 2) Private gate: needs style + lodging + budget match AND score lead.
  var g = ROUTING.privateGate;
  var styleOk = g.styleMatch.indexOf(ctx.facts.style) >= 0;
  var lodgingOk = g.lodgingMatch.indexOf(ctx.facts.lodging) >= 0;
  var budgetOk = g.budgetMatch.indexOf(ctx.facts.budgetSegment) >= 0;
  var privateLeads = ctx.score.private >= g.minScore &&
    ctx.score.private >= ctx.score.signature && ctx.score.private >= ctx.score.visa;

  if ((styleOk || lodgingOk) && budgetOk && privateLeads) {
    if (styleOk || lodgingOk) reasons.push(g.reasonLuxury);
    if (budgetOk) reasons.push(g.reasonBudget);
    return finalize('private', reasons, ctx);
  }

  // 3) Visa wins only if it clearly leads AND nothing points to full planning.
  if (ctx.score.visa > ctx.score.signature && ctx.score.visa > ctx.score.private &&
      !ctx.facts.wantsFullService) {
    reasons.push('VISA_ONLY_ALREADY_PLANNED');
    return finalize('visa', reasons, ctx);
  }

  // 4) Anyone wanting planning but not clearing Private → Signature (default).
  reasons.push(ROUTING.signatureFallback.reason);
  return finalize(ROUTING.defaultRoute, reasons, ctx);
}

function finalize(pkg, reasons, ctx) {
  // Lead temperature: soft/undecided answers past the threshold mark an "explorer".
  // Explorers keep the same package page but get a nurture CTA instead of a deposit charge.
  var exp = ROUTING.explorer || { threshold: 99 };
  var temperature = ctx.score.explorer >= exp.threshold ? 'explorer' : 'buyer';
  if (temperature === 'explorer' && exp.reason) reasons.push(exp.reason);
  return {
    package: pkg,
    reasonCodes: reasons.length ? reasons : [ROUTING.defaultReason],
    score: ctx.score,
    facts: ctx.facts,
    temperature: temperature,
  };
}

export default { decide: decide };
