const { chromium, abre, esp, foto, SITE } = require('./common');
(async () => {
  const b = await chromium.launch();
  for (const vp of ['d','m']) {
    const { ctx, page } = await abre(b, vp);
    await page.goto(SITE, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready); await esp(page, 2500);
    await page.screenshot({ path: `/tmp/claude-0/-home-user-smartled/2ba15095-ae67-51f0-acd3-e77e4b1d05de/scratchpad/ex-${vp}.jpg`, type: 'jpeg', quality: 70 });
    await ctx.close();
  }
  await b.close();
})();
