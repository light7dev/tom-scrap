import * as cheerio from 'cheerio';
import * as fs from 'fs';
import axios from 'axios';
import slugify from "slugify";
axios.defaults.headers.common['Authorization'] = 'ae41e4d7118480f9fd19cf3c9af53781bb59256ed6356c05';

const scrapInfo = {
    website: `https://dwa2v49eg4udc.cloudfront.net/cms/manage/en-US`,
    name: `POST`,
  };

let slugs = {};

export const postSource = () => {
    return new Promise( async (resolve,reject) => {
        let data = '';
        try{
            let data = fs.readFileSync('./ref/slugs.json');
            if(data){
                slugs= JSON.parse(data)
            }       
        }catch(err){
            console.log(slugs)
        }

        for(let i=1;i<6;i++)
            if(!slugs[`${i}`])slugs[`${i}`]=[];
    try {
        for(let i=1;i<6;i++){
            let items = JSON.parse(fs.readFileSync('./results/'+i+'.json', 'utf-8')).entities.jobs;
            for(let j=0;j<items.length;j++){
                items[j].slug=slugify(items[j].slug)
                if(items[j].slug == slugs[`${i}`][`${j}`]) continue;
                try{
                    //Check company list
                    const checkedCompany = await axios.post(scrapInfo.website, {
                        query:`query listCompanies($CompanyListWhereInput:CompanyListWhereInput!) {
                            listCompanies(where:$CompanyListWhereInput) {
                              data {
                                id
                                name
                                slug
                                logo
                                email
                                website
                              }
                            }
                          }
                          `,
                        variables: {
                            CompanyListWhereInput: {
                                name: items[j].company.name,
                            }
                        }

                    }).then(res=>res.data.data?.listCompanies?.data[0])
                    console.log('Checked: ' ,checkedCompany===null);
                    //Add company
                    let cp = null;
                    if(!checkedCompany)
                    cp = await axios.post(scrapInfo.website, {
                        query: `mutation createCompany($name:String!,$slug:String!, $website:String!, $email:String!,$logo:String!){
                            createCompany(data:{name:$name,slug:$slug website:$website, email:$email, logo:$logo}){
                             data {
                                id
                                slug
                              name
                              email
                              website
                              logo
                             }
                            }
                        }`,
                        variables:{
                            name : items[j].company?.name, email : "", website : "", logo : "", slug : ""+items[j].company?.slug
                        }
                    }).then(res => res.data.data?.createCompany?.data?.id)
                    else
                    cp=checkedCompany.id;
                    console.log('Added company: ' ,cp);
                    //Publish company
                    const pcr = await axios.post(scrapInfo.website, {
                        query: `mutation publishCompany($revision:ID!)
                        {
                            publishCompany(revision:$revision){
                                data {
                                    id
                                    name
                                    email
                                }
                            }

                        }
                        `,
                        variables: {
                            revision: cp
                        }
                    }).then(res=>res.data.data?.publishCompany?.data)
                    console.log('Published company: ', pcr.id);
                    //Add job
                    const job = await axios.post(scrapInfo.website, {
                        query: ` 
                            mutation createJob($title:String!,$slug:String!, $jobType:String!,$role:String, $tags:[String], $compensation:[String],$location:String, $applyLink:String, $sticky:Boolean, $highlight:Boolean,$remote:Boolean,$description:JSON!, $company:RefFieldInput){
                            createJob(data:{title:$title,slug:$slug,jobType:$jobType,role:$role,tags:$tags,compensation:$compensation,location:$location,applyLink:$applyLink,sticky:$sticky,highlight:$highlight,remote:$remote,company:$company,description:$description}){
                             data {
                              id
                              title
                              slug
                              jobType
                              role
                              tags
                              compensation
                              location
                              applyLink
                              sticky
                              highlight
                              remote
                              description
                              createdOn
                              company {
                                id
                              }
                             }
                            }
                           }
                        `,
                        variables: {
                            title: items[j].title,
                            slug: items[j].slug,
                            jobType: items[j].jobType,
                            role:items[j].role,
                            tags:items[j].tags,
                            compensation:items[j].compensation,
                            location:items[j].location,
                            applyLink:items[j].applyLink,
                            sticky:items[j].sticky,
                            highlight:items[j].highlight,
                            remote:items[j].remote,
                            description: JSON.parse(items[j].description),
                            createOn:items[j].date,
                            company:{
                                id: ""+pcr.id,
                                modelId: ""+pcr.id,
                            }                         
                        }
                    }).then(res=>res.data.data?.createJob?.data);
                    console.log('Added job:', job.id)
                    //Publish job
                    const pjr = await axios.post(scrapInfo.website, {
                        query: `
                        mutation publishJob($id:ID!){
                            publishJob(revision:$id){
                                data{
                                    id
                                    title
                                    description
                                }
                            }
                        }`,
                        variables:{
                            id:job.id
                        }
                    }).then(res=>res.data.data?.publishJob?.data)
                    //Slugs
                    slugs[`${i}`][`${j}`]=items[j].slug;
                    console.log('Published job: ', pjr.id)
                }catch(err){
                    console.log(err)
                    break;
                }
            }
            //Store slugs
            fs.writeFileSync('./ref/slugs.json', JSON.stringify(slugs))
        }
        resolve()
    } catch (error) {
     reject(error)
      throw error;
    }
});
};
postSource()