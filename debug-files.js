const fs = require('fs');
const path = require('path');

const dir = "C:\\Users\\laure\\Desktop\\Document";
const outputFile = "C:\\Users\\laure\\Desktop\\SimpleSearchInterface\\SimpleSearchInterface\\file-list.txt";

const output = [];

function walk(dir, depth) {
    depth = depth || 0;
    try {
        const files = fs.readdirSync(dir);
        files.forEach(function (file) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            const indent = "  ".repeat(depth);
            if (stat.isDirectory()) {
                output.push(indent + "[DIR] " + file);
                walk(filePath, depth + 1);
            } else {
                output.push(indent + "[FILE] " + file);
            }
        });
    } catch (e) {
        output.push("[ERROR] " + dir + ": " + e.message);
    }
}

output.push("Listing files in: " + dir);
output.push("Timestamp: " + new Date().toISOString());
output.push("---");
walk(dir);
output.push("---");
output.push("Total items: " + (output.length - 3));

fs.writeFileSync(outputFile, output.join("\n"), "utf8");
console.log("Output written to: " + outputFile);
