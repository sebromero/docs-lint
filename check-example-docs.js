const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2); // Get command line arguments
if (args.length !== 1) {
    const scriptName = path.basename(__filename);
    console.error(`Usage: node ${scriptName} <directory_path>`);
    process.exit(-1);
}

const minCommentLines = 4;
const fileExtension = '.ino';

const searchDirectory = args[0];
let failedFiles = [];

function processFile(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const multilineCommentRegex = /\/\*(?<comment>[\s\S]*?)\*\//;

    const match = fileContent.match(multilineCommentRegex);

    if (match) {
        const commentText = match.groups.comment;
        if (!commentText.trim().startsWith('*')) {
            console.error(`❌ ${filePath} has a multiline comment whose lines don't start with an asterisk.`);
            failedFiles.push(filePath);
        } else {
            const commentLines = commentText.split('\n').filter((line) => line.trim().startsWith('*')).length;
            if (commentLines < minCommentLines) {
                console.error(`❌ ${filePath} has an insufficient multiline comment (less than ${minCommentLines} lines).`);
                failedFiles.push(filePath);
            }
        }
    } else {
        const codeContent = fileContent.trim();
        if (codeContent.length > 0) {
            console.error(`${filePath} has code but no valid multiline comment.`);
        } else {
            console.error(`${filePath} has no code comment at all.`);
        }
        failedFiles.push(filePath);
    }
}

function processDirectory(directoryPath) {
    const files = fs.readdirSync(directoryPath);
    files.forEach((file) => {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile() && path.extname(filePath) === fileExtension) {
            processFile(filePath);
        } else if (stats.isDirectory()) {
            processDirectory(filePath);
        }
    });
}

processDirectory(searchDirectory);

if (failedFiles.length > 0) {
    console.error(`Files that failed the check:`);
    failedFiles.forEach((file) => {
        console.error(`- ${file}`);
    });
    process.exit(-1);
} else {
    console.log('✅ All files passed the check.');
}
