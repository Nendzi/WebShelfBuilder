﻿using Autodesk.Forge;
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
        /// Prefix for AppBundles and Activities
        public static string NickName { get { return OAuthController.GetAppSetting("FORGE_CLIENT_ID"); } }
        /// Alias for the app (e.g. DEV, STG, PROD). This value may come from an environment variable
        public static string Alias { get { return "dev"; } }
        // bucket indentification
        static string bucketExtension = "-shelfconfig";
        // bucket region US or EMEA
        private string bucketRegion = "US";
        // Design Automation v3 API
        DesignAutomationClient _designAutomation;

        // Constructor, where env and hubContext are specified
        public DesignAutomationController(IWebHostEnvironment env, IHubContext<DesignAutomationHub> hubContext, DesignAutomationClient api)
        {
            // DesignAutomation must be created as new instance.
            _designAutomation = api;
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
            //TODO - test does it select only Inventor engines
            List<string> inventorEnginesList = new List<string>();
            inventorEnginesList = engines.Data.Where(x => x.Contains("Inventor")).ToList();
            inventorEnginesList.Sort();
            // return list of engines
            return inventorEnginesList;
        }

        /// <summary>
        /// Define a new appbundle
        /// </summary>
        [HttpPost]
        [Route("api/forge/designautomation/appbundles")]
        public async Task<IActionResult> CreateAppBundle([FromBody] JObject appBundleSpecs)
        {
            // basic input validation
            string zipFileName = appBundleSpecs["zipFileName"].Value<string>();
            string engineName = appBundleSpecs["engine"].Value<string>();

            // standard name for this sample
            string appBundleName = zipFileName + "AppBundle";

            // check if ZIP with bundle is here
            string packageZipPath = Path.Combine(LocalBundlesFolder, zipFileName + ".zip");
            if (!System.IO.File.Exists(packageZipPath)) throw new Exception("Appbundle not found at " + packageZipPath);

            // get defined app bundles
            Page<string> appBundles = await _designAutomation.GetAppBundlesAsync();

            // check if app bundle is already define
            dynamic newAppVersion;
            string qualifiedAppBundleId = string.Format("{0}.{1}+{2}", NickName, appBundleName, Alias);
            if (!appBundles.Data.Contains(qualifiedAppBundleId))
            {
                // create an appbundle (version 1)
                AppBundle appBundleSpec = new AppBundle()
                {
                    Package = appBundleName,
                    Engine = engineName,
                    Id = appBundleName,
                    Description = string.Format("Description for {0}", appBundleName),

                };
                newAppVersion = await _designAutomation.CreateAppBundleAsync(appBundleSpec);
                if (newAppVersion == null) throw new Exception("Cannot create new app");

                // create alias pointing to v1
                Alias aliasSpec = new Alias() { Id = Alias, Version = 1 };
                Alias newAlias = await _designAutomation.CreateAppBundleAliasAsync(appBundleName, aliasSpec);
            }
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

            return Ok(new { AppBundle = qualifiedAppBundleId, Version = newAppVersion.Version });
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
            // basic input validation
            string zipFileName = activitySpecs["zipFileName"].Value<string>();
            string engineName = activitySpecs["engine"].Value<string>();

            // standard name for this sample
            string appBundleName = zipFileName + "AppBundle";
            string activityName = zipFileName + "Activity";

            // 
            Page<string> activities = await _designAutomation.GetActivitiesAsync();
            string qualifiedActivityId = string.Format("{0}.{1}+{2}", NickName, activityName, Alias);
            if (!activities.Data.Contains(qualifiedActivityId))
            {
                // define the activity
                dynamic engineAttributes = EngineAttributes();
                string commandLine = string.Format(engineAttributes.commandLine, appBundleName);
                Activity activitySpec = new Activity()
                {
                    Id = activityName,
                    Appbundles = new List<string>() { string.Format("{0}.{1}+{2}", NickName, appBundleName, Alias) },
                    CommandLine = new List<string>() { commandLine },
                    Engine = engineName,
                    Parameters = new Dictionary<string, Parameter>()
                    {
                        { "inputFile", new Parameter()
                            {
                                Description = "input file",
                                LocalName = "$(inputFile)",
                                Ondemand = false,
                                Required = true,
                                Verb = Verb.Get,
                                Zip = false
                            }
                        },
                        { "inputJson", new Parameter()
                            {
                                Description = "input json",
                                LocalName = "params.json",
                                Ondemand = false,
                                Required = false,
                                Verb = Verb.Get,
                                Zip = false
                        }
                                },
                        { "outputFile", new Parameter()
                        {
                                Description = "output file",
                                LocalName = "outputFile." + engineAttributes.extension,
                                Ondemand = false,
                                Required = true,
                                Verb = Verb.Put,
                                Zip = false
                        }
                                }
                    },
                    Settings = new Dictionary<string, ISetting>()
                    {
                        { "script", new StringSetting()
                            {
                                Value = engineAttributes.script
                            }
                        }
                    }
                };
                Activity newActivity = await _designAutomation.CreateActivityAsync(activitySpec);

                // specify the alias for this Activity
                Alias aliasSpec = new Alias() { Id = Alias, Version = 1 };
                Alias newAlias = await _designAutomation.CreateActivityAliasAsync(activityName, aliasSpec);

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
            // basic input validation
            JObject workItemData = JObject.Parse(input.WorkitemData);
            // TODO - Param should be replaced
            string widthParam = workItemData["width"].Value<string>();
            string heigthParam = workItemData["height"].Value<string>();

            string activityName = string.Format("{0}.{1}", NickName, workItemData["activityName"].Value<string>());
            string browerConnectionId = workItemData["browerConnectionId"].Value<string>();

            // save the file on the server
            var fileSavePath = Path.Combine(_env.ContentRootPath, Path.GetFileName(input.InputFile.FileName));
            using (var stream = new FileStream(fileSavePath, FileMode.Create)) await input.InputFile.CopyToAsync(stream);

            // OAuth token
            dynamic oauth = await OAuthController.GetInternalAsync();

            // upload file to OSS Bucket
            // 1. ensure bucket existis
            string bucketKey = NickName.ToLower() + bucketExtension;
            BucketsApi buckets = new BucketsApi();
            buckets.Configuration.AccessToken = oauth.access_token;
            try
            {
                PostBucketsPayload bucketPayload = new PostBucketsPayload(bucketKey, null, PostBucketsPayload.PolicyKeyEnum.Transient);
                await buckets.CreateBucketAsync(bucketPayload, bucketRegion); //TODO - use EMEA buckets also
            }
            catch { }; // in case bucket already exists
                       // 2. upload inputFile
            string inputFileNameOSS = string.Format("{0}_input_{1}", DateTime.Now.ToString("yyyyMMddhhmmss"), Path.GetFileName(input.InputFile.FileName)); // avoid overriding
            ObjectsApi objects = new ObjectsApi();
            objects.Configuration.AccessToken = oauth.access_token;
            using (StreamReader streamReader = new StreamReader(fileSavePath))
                await objects.UploadObjectAsync(bucketKey, inputFileNameOSS, (int)streamReader.BaseStream.Length, streamReader.BaseStream, "application/octet-stream");
            System.IO.File.Delete(fileSavePath);// delete server copy

            // prepare workitem arguments
            // 1. input file
            XrefTreeArgument inputFileArgument = new XrefTreeArgument()
            {
                Url = string.Format("https://developer.api.autodesk.com/oss/v2/buckets/{0}/objects/{1}", bucketKey, inputFileNameOSS),
                Headers = new Dictionary<string, string>()
                {
                    { "Authorization", "Bearer " + oauth.access_token }
                }
            };
            // 2. input json
            dynamic inputJson = new JObject();
            inputJson.Width = widthParam;
            inputJson.Height = heigthParam;
            XrefTreeArgument inputJsonArgument = new XrefTreeArgument()
            {
                Url = "data:application/json, " + ((JObject)inputJson).ToString(Formatting.None).Replace("\"", "'")
            };
            // 3. output file
            // TODO - output file name should be passed from client
            string outputFileNameOSS = string.Format("{0}_output_{1}", 
                DateTime.Now.ToString("yyyyMMddhhmmss"), 
                Path.GetFileName(input.InputFile.FileName)); // avoid overriding
            XrefTreeArgument outputFileArgument = new XrefTreeArgument()
            {
                Url = string.Format("https://developer.api.autodesk.com/oss/v2/buckets/{0}/objects/{1}", bucketKey, outputFileNameOSS),
                Verb = Verb.Put,
                Headers = new Dictionary<string, string>()
                {
                    {"Authorization", "Bearer " + oauth.access_token }
                }
            };

            // prepare & submit workitem
            // the callback contains the connectionId (used to identify the client) and the outputFileName of this workitem
            string callbackUrl = string.Format("{0}/api/forge/callback/designautomation?id={1}&outputFileName={2}", 
                OAuthController.GetAppSetting("FORGE_WEBHOOK_URL"), // TODO - this address is only for dev stage
                browerConnectionId, 
                outputFileNameOSS);
            WorkItem workItemSpec = new WorkItem()
            {
                ActivityId = activityName,
                Arguments = new Dictionary<string, IArgument>()
                {
                    { "inputFile", inputFileArgument },
                    { "inputJson",  inputJsonArgument },
                    { "outputFile", outputFileArgument },
                    { "onComplete", new XrefTreeArgument { Verb = Verb.Post, Url = callbackUrl } }
                }
            };
            WorkItemStatus workItemStatus = await _designAutomation.CreateWorkItemAsync(workItemSpec);

            return Ok(new { WorkItemId = workItemStatus.Id });
        }

        /// <summary>
        /// Input for StartWorkitem
        /// </summary>
        public class StartWorkitemInput
        {
            public IFormFile InputFile { get; set; }
            public string WorkitemData { get; set; }
        }

        /// <summary>
        /// Callback from Design Automation Workitem (onProgress or onComplete)
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

                var client = new RestClient(bodyJson["reportUrl"].Value<string>());
                var request = new RestRequest(string.Empty);

                // send the result output log to the client
                byte[] bs = client.DownloadData(request);
                string report = System.Text.Encoding.Default.GetString(bs);
                await _hubContext.Clients.Client(id).SendAsync("onComplete", report);

                // generate a signed URL to download the result file and send to the client
                ObjectsApi objectsApi = new ObjectsApi();
                dynamic signedUrl = await objectsApi.CreateSignedResourceAsyncWithHttpInfo(NickName.ToLower() + bucketExtension, outputFileName, new PostBucketsSigned(10), "read");
                await _hubContext.Clients.Client(id).SendAsync("downloadResult", (string)(signedUrl.Data.signedUrl));
            }
            catch { }

            // ALWAYS return ok (200)
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