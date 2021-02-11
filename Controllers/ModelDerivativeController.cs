using Autodesk.Forge;
using Autodesk.Forge.Model;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace WebShelfBuilder.Controllers
{
    [ApiController]
    public class ModelDerivativeController : ControllerBase
    {
        /// <summary>
        /// Start the translation job for a give bucketKey/objectName
        /// </summary>
        /// <param name="objModel"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("api/forge/modelderivative/jobs")]
        public async Task<dynamic> TranslateObject([FromBody] TranslateObjectModel objModel)
        {
            dynamic oauth = await OAuthController.GetInternalAsync();

            // prepare the payload
            List<JobPayloadItem> outputs = new List<JobPayloadItem>()
            {
            new JobPayloadItem(
                JobPayloadItem.TypeEnum.Svf,
                new List<JobPayloadItem.ViewsEnum>()
                {
                JobPayloadItem.ViewsEnum._2d,
                JobPayloadItem.ViewsEnum._3d
                })
            };
            JobPayload job;
            job = new JobPayload(new JobPayloadInput(objModel.ObjectName, true, "MyWallShelf.iam"), new JobPayloadOutput(outputs));

            // start the translation
            DerivativesApi derivative = new DerivativesApi();
            derivative.Configuration.AccessToken = oauth.access_token;
            dynamic jobPosted = await derivative.TranslateAsync(job);
            return jobPosted;
        }

        /// <summary>
        /// Model for TranslateObject method
        /// </summary>
        public class TranslateObjectModel
        {
            public string BucketKey { get; set; }
            public string ObjectName { get; set; }
        }
    }
}
