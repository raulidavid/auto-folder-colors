const assert = require('assert');

// Log Colors
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    cyan: "\x1b[36m"
};

console.log(`${colors.cyan}--- Running Standalone Logic Tests ---${colors.reset}\n`);

// 1. Test adjustColor
function adjustColor(color, percent, lighten = true) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const adjust = (val) => lighten ? Math.min(255, val + amt) : Math.max(0, val - amt);
    const R = adjust(num >> 16);
    const G = adjust((num >> 8) & 0x00FF);
    const B = adjust(num & 0x0000FF);

    console.log(`Debug Color: R=${R}, G=${G}, B=${B}`);

    const part = (val) => val.toString(16).padStart(2, '0');
    return "#" + part(R) + part(G) + part(B);
}

try {
    const original = "#007acc";
    const lighter = adjustColor(original, 15, true);
    const darker = adjustColor(original, 10, false);

    assert.notStrictEqual(original, lighter, "Lighter color should be different");
    assert.strictEqual(lighter, "#26a0f2", "Lighter color calculation failed");
    assert.strictEqual(darker, "#0060b2", "Darker color calculation failed");

    console.log(`${colors.green}✓ adjustColor tests passed${colors.reset}`);
} catch (e) {
    console.log(`${colors.red}✗ adjustColor tests failed: ${e.message}${colors.reset}`);
}

// 2. Test getColorForPath with Mocked state
const pathColorCache = new Map();
const MAX_CACHE_SIZE = 100;
let foldersCache = {
    "frontend": "#dc3545",
    "backend": "#007acc"
};

function getColorForPath(filePath) {
    if (!filePath) return null;
    if (pathColorCache.has(filePath)) return pathColorCache.get(filePath);

    let result = null;
    for (const [folderName, color] of Object.entries(foldersCache)) {
        if (filePath.includes(`/${folderName}/`) || filePath.includes(`\\${folderName}\\`)) {
            result = { name: folderName, color };
            break;
        }
    }

    if (pathColorCache.size >= MAX_CACHE_SIZE) {
        const firstKey = pathColorCache.keys().next().value;
        pathColorCache.delete(firstKey);
    }
    pathColorCache.set(filePath, result);
    return result;
}

try {
    // Test detection
    const path1 = "C:\\projects\\my-app\\frontend\\src\\index.js";
    const res1 = getColorForPath(path1);
    assert.ok(res1, "Should detect folder");
    assert.strictEqual(res1.name, "frontend");

    // Test cache
    const res1_again = getColorForPath(path1);
    assert.strictEqual(pathColorCache.size, 1);
    assert.deepStrictEqual(res1, res1_again, "Cache should return same object");

    // Test different OS paths
    const linuxPath = "/home/user/backend/api/main.py";
    const res2 = getColorForPath(linuxPath);
    assert.strictEqual(res2.name, "backend");

    console.log(`${colors.green}✓ getColorForPath logic & cache tests passed${colors.reset}`);
} catch (e) {
    console.log(`${colors.red}✗ getColorForPath tests failed: ${e.message}${colors.reset}`);
}

// 3. Test Cache Eviction
try {
    pathColorCache.clear();
    for (let i = 0; i < 105; i++) {
        getColorForPath(`path/to/folder/${i}`);
    }
    assert.strictEqual(pathColorCache.size, 100, "Cache should not exceed MAX_CACHE_SIZE");
    console.log(`${colors.green}✓ Cache eviction (LRU) tests passed${colors.reset}`);
} catch (e) {
    console.log(`${colors.red}✗ Cache eviction tests failed: ${e.message}${colors.reset}`);
}

console.log(`\n${colors.cyan}--- All Logic Tests Completed ---${colors.reset}`);
