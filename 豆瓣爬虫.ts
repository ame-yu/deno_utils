/********** 程序效果 **********
deno run -A 本文件名.ts random
随机爬取电影基本信息，回车停止后保存到movie.json
********** 可调参数 **********
@param startId 开始的ID
*/
import cheerio from "https://tiny-disk-3d69.google0.workers.dev/cheerio";
import { readLine, hintInput } from "./CLI.ts";

var startId = 2973078
if(Deno.args[0] === "random") 
    startId = 30100000 + (Math.random() * 331959) | 0
const delay = 10
var urlGen = (function gen(start: number){
    var uid = start
    const next = (): string => `https://movie.douban.com/subject/${++uid}/`
    return {next}
})(startId)


let list: ResouceList = {
    "title": `span[property="v:itemreviewed"]`,
    "language": {
        selector: `#content`,
        processor: (v: string) => /语言:\s(.*)/.exec(v)?.[1] ?? "未知"
    },
    "length": `span[property="v:runtime"]`,
    "releaseDate": `span[property="v:initialReleaseDate"]`,
    "synopsis": {
        selector: `#content span[property="v:summary"]`,
        processor: (v: string) => v.trim()
    },
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
interface ResouceList{
    [fieldName: string]: string | ScrapOption
}
interface ScrapOption{
    selector: string
    processor: (arg: string) => string
}


async function fetchDom(url: string): Promise<Function>{
    var rsp = (await fetch(url))
    var rawHtml = await rsp.text()
    return cheerio.load(rawHtml)
}

type KeyValue =  {[name: string]: string}

async function scrape(url:string): Promise<KeyValue> {
    let res:KeyValue = {}
    let query = await fetchDom(url)

    for(let key of Object.keys(list)){
        let value = list[key]
        if(typeof value == "string"){
            res[key] = query(value).text()
        }else{
            let {selector, processor} = value
            let text = query(selector).text()
            res[key] = processor(text)
        }
    }
    return res
}

console.log("Scan from id:" + startId)
var dataSet: Array<KeyValue> = []
var pause = undefined
readLine().then(rst => {
    pause = "Yes"
})
console.log("Enter to pasue...")
while(true){
    await sleep(delay)
    if(pause) break
    var url = urlGen.next()
    var rsp = (await fetch(url))
    if(rsp.status === 200){
        var res = await scrape(url)
        res.url = url 
        console.log(res)
        dataSet.push(res)
    }
}

//保存
console.log(`collect ${dataSet.length} movies, writing local json...` )
Deno.writeTextFileSync('./movie.json',JSON.stringify(dataSet))

await sleep(2000)
