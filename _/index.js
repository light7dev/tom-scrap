const main = () => {
  start();
};

const start = async () => {
  for(let i=1;i<=5;i++){
    console.log(`====== START: ${i} ======`)
    const filePath = `./scrapers/scraper${i}.js`;
    delete require.cache[filePath];
    let scraperModule = require(filePath)['scraperModule'];
    await scraperModule.processFetch();
    console.log(`========== END ==========`)
  }
  const filePath = `./post.js`;
  delete require.cache[filePath];
  let postSource = require(filePath);
  postSource();
  setTimeout(() => {
      start();
  }, 1000*1800);
}

main();
