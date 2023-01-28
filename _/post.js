import * as cheerio from 'cheerio';
import * as fs from 'fs';
import axios from 'axios';

axios.defaults.headers.common['Authorization'] = 'ae41e4d7118480f9fd19cf3c9af53781bb59256ed6356c05';

const scrapInfo = {
    website: `https://dwa2v49eg4udc.cloudfront.net/cms/manage/en-US`,
    name: `POST`,
  };

const postSource = () => {
    return new Promise( async (resolve,reject) => {
    try {
        for(let i=1;i<=5;i++){
            let items = JSON.parse(fs.readFileSync('./results/'+i+'.json', 'utf-8')).entities.jobs;
            console.log(items.length);
            for(let j=0;j<items.length;j++){
                try{
                    await axios.post(scrapInfo.website, items[j]);
                    console.log(items[j])
                }catch(err){
                    console.log(err)
                    break;
                }
            }
        }
        resolve()
    } catch (error) {
     reject(error)
      throw error;
    }
});
};

postSource()
.then(()=>{

})
.catch();
