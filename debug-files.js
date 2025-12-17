const fs = require('fs');
const path = require('path');

const dir = "C:\\Users\\laure\\Desktop\\Document";

function walk(dir) {
    try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                walk(filePath);
            } else {
                console.log("FILE:", filePath);
            }
        });
    } catch (e) {
        console.error("ERROR accessing " + dir + ": " + e.message);
    }
}

console.log("Listing files in:", dir);
walk(dir);
