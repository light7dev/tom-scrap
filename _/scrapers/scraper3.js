import * as cheerio from 'cheerio';
import * as fs from 'fs';
const puppeteer = require('puppeteer')

const scrapInfo = {
    website: `https://jobs3.io/jobs/`,
    name: `Jobs3.io`,
  };

const fetchSource = () => {
    return new Promise( async (resolve,reject) => {
    try {
      const browserURL = 'http://127.0.0.1:21222';
        const browser = await puppeteer.connect({browserURL});

        // const browser = await puppeteer.launch({
        //     headless: false
        // })
        const page = await browser.newPage()
        await page.goto(scrapInfo.website,{
            waitUntil: 'load',
            timeout: 0
        })
        let entities = {
          jobs:[
              // {
              //   title: "",
              //   slug: "",
              //   jobType: "",
              //   role: "",
              //   tags: [],
              //   compensation: ["", ""],
              //   location: "",
              //   applyLink: "",
              //   sticky: true,
              //   highlight: true,
              //   remote: false,
              //   description: "",
              //   company: {
              //     name: "",
              //     slug: "",
              //     logo: {},
              //   }
              // }
          ]    
        }

        const html =  await page.evaluate(async () => {
            return document.body.innerHTML;  
        })

        const $ = cheerio.load(html);

        let trs = $('.wp-jobsearch-dev-job-content li.jobsearch-column-12')
        for(let i=0;i<trs.length;i++){
          let job = {}
          job.company = {};
          job.title = $(trs[i]).find('.jobsearch-pst-title a').eq(0).text().trim();
          job.date = $(trs[i]).find('.jobsearch-calendar').eq(0).parent().text().trim();
          let t = ($(trs[i]).find('.jobsearch-salary').eq(0).parent().text().trim().split(' '))
          if(t.length==2){
            let _salarys = (t)[1].split('-');
            job.compensation = [];
            job.compensation.push(_salarys[0]+'k')
            job.compensation.push('$'+_salarys[1])
          }
          job.company.name = $(trs[i]).find('.job-company-name').eq(0).text().split('@')[1];
          job.company.slug = job.company.name + '' + job.title;
          job.logo = {};
          // let link = $(trs[i]).find('.job-company-name a').eq(0).attr('href');
          job.tags = $(trs[i]).find('.jobsearch-filter-tool-black-shape').eq(0).parent().text().trim().split(',').map(t=>t.trim());
          if(i==0)
          {job.applyLink='';
          job.description='';}
          else
          {
            job.applyLink = $(trs[i]).find('a.applynowbtn').eq(0).attr('href');
            await page.goto(job.applyLink,{
              waitUntil: 'load',
              timeout: 0
            })
            const html2 =  await page.evaluate(async () => {
              return document.body.innerHTML;  
            })
            const $2 = cheerio.load(html2);
            job.description = JSON.stringify({'About the job': $2('.jobsearch-description').eq(0).html()});
          }
          job.remote = $(trs[i]).find('a.applynowbtn').eq(1).text() == 'Remote'
          job.slug = job.company.name+' '+job.title;
          entities.jobs.push(job)
        }
        // browser.close()
        resolve(entities)
    } catch (error) {
     reject(error)
      throw error;
    }
});
};

const processFetch = async () => {
   await fetchSource()
    .then((data) => {
      let resData = {
        name: scrapInfo.name,
        website: scrapInfo.website,
        entities: data,
      };
      fs.writeFile('./results/3.json', JSON.stringify(resData, null, 2), 'utf8', () => {
      });
    })
    .catch();
};

export const scraperModule = {
  processFetch
};
