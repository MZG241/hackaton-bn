import fs from "fs";
import path from "path";

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith(".ts") && !dirFile.includes("node_modules")) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync("./src");
let replacedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  // Replace .js inside import strings that are relative (start with . or ..)
  const regex = /from\s+(['"])(\.\.?\/[^'"]+)\.js\1/g;
  if (regex.test(content)) {
    content = content.replace(regex, 'from $1$2$1');
    fs.writeFileSync(file, content, "utf8");
    console.log(`Replaced in ${file}`);
    replacedCount++;
  }
}

console.log(`Done. Replaced in ${replacedCount} files.`);
