const assert = require('assert');

function adjustColor(color, percent, lighten = true) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const adjust = (val) => lighten ? Math.min(255, val + amt) : Math.max(0, val - amt);

    const R = adjust(num >> 16);
    const G = adjust((num >> 8) & 0x00FF);
    const B = adjust(num & 0x0000FF);

    return "#" + (0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

suite('Logic Unit Tests', () => {
    test('adjustColor should lighten colors correctly', () => {
        const result = adjustColor('#007acc', 15, true);
        assert.strictEqual(result, '#26a0f2');
    });

    test('adjustColor should darken colors correctly', () => {
        const result = adjustColor('#007acc', 10, false);
        assert.strictEqual(result, '#0060b2');
    });

    test('adjustColor should handle black and white limits', () => {
        assert.strictEqual(adjustColor('#000000', 10, false), '#000000');
        assert.strictEqual(adjustColor('#ffffff', 10, true), '#ffffff');
    });
});
