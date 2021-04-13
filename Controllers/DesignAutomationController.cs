using Autodesk.Forge;
using Autodesk.Forge.DesignAutomation;
using Autodesk.Forge.DesignAutomation.Model;
using Autodesk.Forge.Model;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using RestSharp;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using WebShelfBuilder.Builders;
using WebShelfBuilder.Hubs;
using Activity = Autodesk.Forge.DesignAutomation.Model.Activity;
using Alias = Autodesk.Forge.DesignAutomation.Model.Alias;
using AppBundle = Autodesk.Forge.DesignAutomation.Model.AppBundle;
using Parameter = Autodesk.Forge.DesignAutomation.Model.Parameter;
using WorkItem = Autodesk.Forge.DesignAutomation.Model.WorkItem;
using WorkItemStatus = Autodesk.Forge.DesignAutomation.Model.WorkItemStatus;

namespace WebShelfBuilder.Controllers

{
    [ApiController]
    public class DesignAutomationController : ControllerBase
    {
        // Used to access the application folder (temp location for files & bundles)
        private IWebHostEnvironment _env;
        // used to access the SignalR Hub
        private IHubContext<DesignAutomationHub> _hubContext;
        // Local folder for bundles
        public string LocalBundlesFolder { get { return Path.Combine(_env.WebRootPath, "bundles"); } }
        public string LocalDataSetFolder { get { return Path.Combine(_env.WebRootPath, "inputFiles"); } }
        // Engine
        private string _engine;
        public string EngineName
        {
            get
            {
                return _engine;
            }
            set
            {
                _engine = value;
            }
        }
        // Bundle file
        public string ZipFileName { get { return "DA4ShelfBuilderPlugin.bundle.zip"; } }
        // Bundle name
        public string AppBundleName { get { return "WallShelfConfig"; } }
        // Activity name
        public static string ActivityName { get { return "WallShelfConfig"; } }

        public string NickName { get { return OAuthController.GetAppSetting("FORGE_CLIENT_ID"); } }
        /// Alias for the app (e.g. DEV, STG, PROD). This value may come from an environment variable
        public string Alias { get { return "alpha"; } }
        // bucket name
        public string bucketKey => (NickName + "-" + AppBundleName).ToLower();
        // bucket region US or EMEA
        private string bucketRegion = "US";
        // Design Automation v3 API
        DesignAutomationClient _designAutomation;

        // Constructor, where env and hubContext are specified
        public DesignAutomationController(IWebHostEnvironment env, IHubContext<DesignAutomationHub> hubContext, DesignAutomationClient api)
        {
            // DesignAutomation must be created as new instance.
            DesignAutomationClientBuilder da = new DesignAutomationClientBuilder(
                OAuthController.GetAppSetting("FORGE_CLIENT_ID"),
                OAuthController.GetAppSetting("FORGE_CLIENT_SECRET")
                );
            _designAutomation = da.Client;
            _env = env;
            _hubContext = hubContext;
        }

        /// <summary>
        /// Names of app bundles on this project
        /// </summary>
        [HttpGet]
        [Route("api/appbundles")]
        public string[] GetLocalBundles()
        {
            return Directory.GetFiles(LocalBundlesFolder, "*.zip").Select(Path.GetFileNameWithoutExtension).ToArray();
        }

        /// <summary>
        /// Return a list of available engines
        /// </summary>
        [HttpGet]
        [Route("api/forge/designautomation/engines")]
        public async Task<List<string>> GetAvailableEngines()
        {
            dynamic oauth = await OAuthController.GetInternalAsync();

            // define Engines API
            Page<string> engines = await _designAutomation.GetEnginesAsync();
            engines.Data.Sort();
            // return list of engines
            return engines.Data;
        }

        /// <summary>
        /// Define a new appbundle
        /// </summary>
        [HttpPost]
        [Route("api/forge/designautomation/appbundles")]
        public async Task<IActionResult> CreateAppBundle([FromBody] JObject appBundleSpecs) //
        {
            //each call make new instance so every time i is nessessary to read Engine name
            string EngineName = appBundleSpecs["engine"].Value<string>();

            // check if ZIP with bundle is here
            string packageZipPath = Path.Combine(LocalBundlesFolder, ZipFileName);
            if (!System.IO.File.Exists(packageZipPath)) throw new Exception("Appbundle not found at " + packageZipPath);

            // get defined app bundles
            Page<string> appBundles = await _designAutomation.GetAppBundlesAsync();

            // check if app bundle is already define
            dynamic newAppVersion;
            string qualifiedAppBundleId = string.Format("{0}.{1}+{2}", NickName, AppBundleName, Alias);
            if (!appBundles.Data.Contains(qualifiedAppBundleId))
            {
                // create an appbundle (version 1)
                AppBundle appBundleSpec = new AppBundle()
                {
                    Package = packageZipPath,
                    Engine = EngineName,
                    Id = AppBundleName,
                    Description = "Creates wall shelf based on JSON file",

                };
                newAppVersion = await _designAutomation.CreateAppBundleAsync(appBundleSpec);
                if (newAppVersion == null) throw new Exception("Cannot create new app");

                // create alias pointing to v1
                Alias aliasSpec = new Alias() { Id = Alias, Version = 1 };
                Alias newAlias = await _designAutomation.CreateAppBundleAliasAsync(AppBundleName, aliasSpec);

                //upload the zip with .bundle
                RestClient uploadClient = new RestClient(newAppVersion.UploadParameters.EndpointURL);
                RestRequest request = new RestRequest(string.Empty, Method.POST);
                request.AlwaysMultipartFormData = true;
                foreach (KeyValuePair<string, string> x in newAppVersion.UploadParameters.FormData) request.AddParameter(x.Key, x.Value);
                request.AddFile("file", packageZipPath);
                request.AddHeader("Cache-Control", "no-cache");
                await uploadClient.ExecuteAsync(request);
            }
            /*
            else // TODO - Remove this code for creating versions.
            {
                // create new version
                AppBundle appBundleSpec = new AppBundle()
                {
                    Engine = engineName,
                    Description = appBundleName
                };
                newAppVersion = await _designAutomation.CreateAppBundleVersionAsync(appBundleName, appBundleSpec);
                if (newAppVersion == null) throw new Exception("Cannot create new version");

                // update alias pointing to v+1
                AliasPatch aliasSpec = new AliasPatch()
                {
                    Version = newAppVersion.Version
                };
                Alias newAlias = await _designAutomation.ModifyAppBundleAliasAsync(appBundleName, Alias, aliasSpec);
            }

            // upload the zip with .bundle
            RestClient uploadClient = new RestClient(newAppVersion.UploadParameters.EndpointURL);
            RestRequest request = new RestRequest(string.Empty, Method.POST);
            request.AlwaysMultipartFormData = true;
            foreach (KeyValuePair<string, string> x in newAppVersion.UploadParameters.FormData) request.AddParameter(x.Key, x.Value);
            request.AddFile("file", packageZipPath);
            request.AddHeader("Cache-Control", "no-cache");
            await uploadClient.ExecuteAsync(request);

            return Ok(new { AppBundle = qualifiedAppBundleId, Version = newAppVersion.Version });*/
            return Ok(new { AppBundle = qualifiedAppBundleId, Version = "1" });
        }

        /// <summary>
        /// Helps identify the engine
        /// </summary>
        private dynamic EngineAttributes()
        {
            return new
            {
                commandLine = "$(engine.path)\\inventorcoreconsole.exe /i \"$(args[inputFile].path)\" /al \"$(appbundles[{0}].path)\"",
                extension = "iam",
                script = string.Empty
            };
        }

        /// <summary>
        /// Define a new activity
        /// </summary>
        [HttpPost]
        [Route("api/forge/designautomation/activities")]
        public async Task<IActionResult> CreateActivity([FromBody] JObject activitySpecs)
        {
            string EngineName = activitySpecs["engine"].Value<string>();

            Page<string> activities = await _designAutomation.GetActivitiesAsync();
            string qualifiedActivityId = string.Format("{0}.{1}+{2}", NickName, ActivityName, Alias);
            if (!activities.Data.Contains(qualifiedActivityId))
            {
                // define the activity
                dynamic engineAttributes = EngineAttributes();
                string commandLine = string.Format(engineAttributes.commandLine, AppBundleName);
                Activity activitySpec = new Activity()
                {
                    Id = ActivityName,
                    Appbundles = new List<string>() { string.Format("{0}.{1}+{2}", NickName, AppBundleName, Alias) },
                    CommandLine = new List<string>() { commandLine },
                    Engine = EngineName,
                    Parameters = new Dictionary<string, Parameter>()
                    {
                        { "inputFile", new Parameter()
                            {
                                Description = "input Data Set for wall shelf creation",
                                LocalName = "MyWallShelf.iam",
                                Verb = Verb.Get,
                                Zip = true
                            }
                        },
                        { "outputFile", new Parameter()
                            {
                                Description = "Resulting model and drawing",
                                LocalName = "Wall_shelf",
                                Verb = Verb.Put,
                                Zip = true
                            }
                        },
                        { "outputPDFFile", new Parameter()
                            {
                                Description="Drawing in PDF format",
                                LocalName=@"Wall_shelf\test.pdf",
                                Verb=Verb.Put,
                                Zip=false
                            }
                        }
                    }
                };
                Activity newActivity = await _designAutomation.CreateActivityAsync(activitySpec);

                // specify the alias for this Activity
                Alias aliasSpec = new Alias() { Id = Alias, Version = 1 };
                Alias newAlias = await _designAutomation.CreateActivityAliasAsync(ActivityName, aliasSpec);

                return Ok(new { Activity = qualifiedActivityId });
            }

            // as this activity points to a AppBundle "dev" alias (which points to the last version of the bundle),
            // there is no need to update it (for this sample), but this may be extended for different contexts
            return Ok(new { Activity = "Activity already defined" });
        }

        /// <summary>
        /// Get all Activities defined for this account
        /// </summary>
        [HttpGet]
        [Route("api/forge/designautomation/activities")]
        public async Task<List<string>> GetDefinedActivities()
        {
            // filter list of 
            Page<string> activities = await _designAutomation.GetActivitiesAsync();
            List<string> definedActivities = new List<string>();
            foreach (string activity in activities.Data)
                if (activity.StartsWith(NickName) && activity.IndexOf("$LATEST") == -1)
                    definedActivities.Add(activity.Replace(NickName + ".", String.Empty));

            return definedActivities;
        }

        /// <summary>
        /// Start a new workitem
        /// </summary>
        [HttpPost]
        [Route("api/forge/designautomation/workitems")]
        public async Task<IActionResult> StartWorkitem([FromForm] StartWorkitemInput input)
        {

            try
            {
                DataSetBuilder dataSetBuilder = new DataSetBuilder(LocalDataSetFolder, "DataSet");
                dataSetBuilder.SaveJsonData(input.shelfData, "params.json");
                dataSetBuilder.ZipFolder("MyWallShelf.zip");
            }
            catch (Exception ex)
            {
                return Ok(new { WorkItemId = ex.Message }); ;
            }

            JObject connItemData = JObject.Parse(input.forgeData);
            string uniqueActivityName = string.Format("{0}.{1}+{2}", NickName, ActivityName, Alias);
            string browserConnectionId = connItemData["browerConnectionId"].Value<string>();

            // TODO - this piece of cod will be used for sending picture in Visualization module
            // save the file on the server
            var fileSavePath = Path.Combine(LocalDataSetFolder, "MyWallShelf.zip");
            //using (var stream = new FileStream(fileSavePath, FileMode.Create)) await input.inputFile.CopyToAsync(stream);

            // OAuth token
            dynamic oauth = await OAuthController.GetInternalAsync();

            // upload file to OSS Bucket
            // 1. ensure bucket existis
            BucketsApi buckets = new BucketsApi();
            buckets.Configuration.AccessToken = oauth.access_token;
            try
            {
                PostBucketsPayload bucketPayload = new PostBucketsPayload(bucketKey, null, PostBucketsPayload.PolicyKeyEnum.Transient);
                await buckets.CreateBucketAsync(bucketPayload, bucketRegion); //TODO - use EMEA buckets also
            }
            catch { }; // in case bucket already exists
                       // 2. upload inputFile
            string inputFileNameOSS = string.Format("{0}_input_{1}", DateTime.Now.ToString("yyyyMMddhhmmss"), "MyShelf.zip"); // avoid overriding
            ObjectsApi objects = new ObjectsApi();
            objects.Configuration.AccessToken = oauth.access_token;
            using (StreamReader streamReader = new StreamReader(fileSavePath))
                await objects.UploadObjectAsync(bucketKey, inputFileNameOSS, (int)streamReader.BaseStream.Length, streamReader.BaseStream, "application/octet-stream");
            //System.IO.File.Delete(fileSavePath);// delete server copy

            // prepare workitem arguments
            // 1. input file
            XrefTreeArgument inputFileArgument = new XrefTreeArgument()
            {
                Verb = Verb.Get,
                LocalName = "Wall_shelf",
                PathInZip = "MyWallShelf.iam",
                Url = string.Format("https://developer.api.autodesk.com/oss/v2/buckets/{0}/objects/{1}", bucketKey, inputFileNameOSS),
                Headers = new Dictionary<string, string>()
                {
                    { "Authorization", "Bearer " + oauth.access_token }
                }
            };
            // 2. input json
            /*dynamic inputJson = new JObject();
            inputJson.Width = widthParam;
            inputJson.Height = heigthParam;
            XrefTreeArgument inputJsonArgument = new XrefTreeArgument()
            {
                Url = "data:application/json, " + ((JObject)inputJson).ToString(Formatting.None).Replace("\"", "'")
            };*/
            // 3. output file
            // TODO - output file name should be passed from client
            string outputFileNameOSS = string.Format("{0}_output_{1}", DateTime.Now.ToString("yyyyMMddhhmmss"), "Result.zip"); // avoid overriding
            XrefTreeArgument outputFileArgument = new XrefTreeArgument()
            {
                Url = string.Format("https://developer.api.autodesk.com/oss/v2/buckets/{0}/objects/{1}", bucketKey, outputFileNameOSS),
                Verb = Verb.Put,
                Headers = new Dictionary<string, string>()
                {
                    {"Authorization", "Bearer " + oauth.access_token }
                }
            };
            // 3a. output pdf fajl out of zipping
            string outputPDFFileNameOSS = string.Format("{0}_output_{1}", DateTime.Now.ToString("yyyyMMddhhmmss"), "Result.pdf"); // avoid overriding
            XrefTreeArgument outputPDFFileArgument = new XrefTreeArgument()
            {
                Url = string.Format("https://developer.api.autodesk.com/oss/v2/buckets/{0}/objects/{1}", bucketKey, outputPDFFileNameOSS),
                Verb = Verb.Put,
                Headers = new Dictionary<string, string>()
                {
                    {"Authorization", "Bearer " + oauth.access_token }
                }
            };
            // prepare & submit workitem
            // the callback contains the connectionId (used to identify the client) and the outputFileName of this workitem

            XrefTreeArgument completedArgument = new XrefTreeArgument()
            {
                Verb = Verb.Post,
                Url = string.Format(
                "{0}/api/forge/callback/designautomation?id={1}&outputFileName={2}",
                OAuthController.GetAppSetting("FORGE_WEBHOOK_URL"), 
                //"https://webwallshelfbuilder.herokuapp.com",
                browserConnectionId,
                outputFileNameOSS)
            };

            XrefTreeArgument progressArgument = new XrefTreeArgument()
            {
                Verb = Verb.Post,
                Url = string.Format(
                    "{0}/api/forge/callback/designautomation/progress?id={1}",
                    OAuthController.GetAppSetting("FORGE_WEBHOOK_URL"), 
                    //"https://webwallshelfbuilder.herokuapp.com",
                    browserConnectionId)
            };

            WorkItem workItemSpec = new WorkItem()
            {
                ActivityId = uniqueActivityName,
                Arguments = new Dictionary<string, IArgument>()
                {
                    { "inputFile", inputFileArgument },
                    { "outputFile", outputFileArgument },
                    { "outputPDFFile", outputPDFFileArgument },
                    { "onComplete", completedArgument },
                    { "onProgress", progressArgument }
                }
            };

            try
            {
                WorkItemStatus workItemStatus = await _designAutomation.CreateWorkItemAsync(workItemSpec);
                return Ok(new
                {
                    WorkItemId = workItemStatus.Id
                });
            }
            catch (Exception e)
            {
                return Ok(new { WorkItemId = e.Message });
            }
        }

        /// <summary>
        /// Input for StartWorkitem
        /// </summary>
        public class StartWorkitemInput
        {
            public IFormFile inputFile { get; set; }
            public string shelfData { get; set; }
            public string forgeData { get; set; }
        }

        /// <summary>
        /// Callback from Design Automation Workitem onComplete
        /// </summary>
        [HttpPost]
        [Route("/api/forge/callback/designautomation")]
        public async Task<IActionResult> OnCallback(string id, string outputFileName, [FromBody] dynamic body)
        {
            try
            {
                // your webhook should return immediately! we can use Hangfire to schedule a job
                JObject bodyJson = JObject.Parse((string)body.ToString());
                await _hubContext.Clients.Client(id).SendAsync("onComplete", bodyJson.ToString());

                /*
                var client = new RestClient(bodyJson["reportUrl"].Value<string>());
                var request = new RestRequest(string.Empty);
                
                // send the result output log to the client
                byte[] bs = client.DownloadData(request);
                string report = System.Text.Encoding.Default.GetString(bs);
                await _hubContext.Clients.Client(id).SendAsync("onComplete", report);*/
               
                // generate copy of object to translate in 2D. Original will be transpated in 3D
                ObjectsApi objectsApi = new ObjectsApi();
                string[] outputFileNameParts = outputFileName.Split('_');
                string newFileName = outputFileNameParts[0] + "_outcopy_" + outputFileNameParts[2];
                await objectsApi.CopyToAsync(bucketKey, outputFileName, newFileName);
            }
            catch { }

            // ALWAYS return ok (200)
            return Ok();
        }

        /// <summary>
        /// Callback from Design Automation Workitem onProgress
        /// </summary>
        [HttpPost]
        [Route("/api/forge/callback/designautomation/progress")]

        public async Task<IActionResult> OnCallback(string id, [FromBody] dynamic body)
        {
            try
            {
                // send the progress report
                JObject bodyJson = JObject.Parse((string)body.ToString());
                await _hubContext.Clients.Client(id).SendAsync("onProgress", bodyJson.ToString());
            }
            catch{}

            return Ok();
        }

        /// <summary>
        /// Clear the accounts
        /// </summary>
        [HttpDelete]
        [Route("api/forge/designautomation/account")]
        public async Task<IActionResult> ClearAccount()
        {
            // clear account
            await _designAutomation.DeleteForgeAppAsync("me");
            return Ok();
        }
    }
}