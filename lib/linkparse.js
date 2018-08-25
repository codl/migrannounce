export default function parse_links(header){
    let links = []
    let values = header.split(',');
    for(let value of values){
        let parts = value.split(';');
        let url;
        let params = {};
        for(let part of parts){
            part = part.trim();
            if(part.startsWith('<') && part.endsWith('>')){
                url = part.substring(1, part.length-1);
            }
            else if(part.indexOf('=') != -1){
                let keyvalue = part.split('=');
                let key = keyvalue[0].trim();
                let value = strip_quotes(keyvalue[1].trim());
                params[key] = value;
            }
        }
        links.push({url, params});
    }

    return links;
}

export function find_link(header, rel){
    let links = parse_links(header);
    for(let link of links){
        if(link['params']['rel'] == rel){
            return link['url'];
        }
    }
}

function strip_quotes(string){
    if(
        (string.startsWith('"') && string.endsWith('"')) ||
        (string.startsWith("'") && string.endsWith("'"))){
        return string.substring(1, string.length-1)
    }
    return string
}
