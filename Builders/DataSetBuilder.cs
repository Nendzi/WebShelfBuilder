using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IO;
using System.IO.Compression;

namespace WebShelfBuilder.Builders
{
    public class DataSetBuilder
    {
        private readonly string _path;
        private readonly string _folder;

        public DataSetBuilder(string path, string folder)
        {
            _path = path;
            _folder = folder;
        }
        public void SaveJsonData(string jsonData, string fileName)
        {
            File.WriteAllText(_path + "\\"+_folder + "\\" + fileName, jsonData);
        }

        public void ZipFolder(string zipFileName)
        {
            string fullZipFileName = _path + "\\" + zipFileName;
            if (File.Exists(fullZipFileName))
            {
                File.Delete(fullZipFileName);
            }
            ZipFile.CreateFromDirectory(_path + "\\" + _folder, fullZipFileName);
        }
    }
}
