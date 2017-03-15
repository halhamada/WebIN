function getSearchCount(data)
{
	var count=0;

	if(data.twitLoc) count+=1;
	if(data.twitKey) count+=1;
	if(data.screenNames) count+=1;
	if(data.FID) count+=1;
	if(data.LocName) count+=1;
	if(data.userName) count+=1;
    if(data.venueNames) count+=1;

	return count;
}
/**
 *@param: ssss
 *

 */
function toBrowser(count,data,res)
{
	if(count==0)
	{

		res.json(data);
		res.end();
	}
}


exports.getSearchCount=getSearchCount;
exports.toBrowser=toBrowser;

