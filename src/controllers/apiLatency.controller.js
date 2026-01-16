
const extractapilatency=(req,res)=>{
    const resourceSpans=req.body.resourceSpans;
    const result={};
    resourceSpans?.forEach(resourceSpan=>{
        resourceSpan.scopeSpans?.forEach(scopeSpan=>{
            scopeSpan.spans?.forEach(span=>{
               if(span.atrubute?.["http.route"]){
                const duration= (span.endTimeUnixNano - span.startTimeUnixNano) / 1e6;
                result.push({
                    route:span.atrubute?.["http.route"],
                    method:span.atrubute?.["http.method"],
                    duration:duration
                })
               }
            })
        })
    })
    return result
}