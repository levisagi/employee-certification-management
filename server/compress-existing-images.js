/**
 * סקריפט לדחיסת תמונות קיימות בדאטאבייס
 * מדחיס תמונות פרופיל ותעודות כיול
 */

const { Pool } = require('pg');
const sharp = require('sharp');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false
});

/**
 * המרת Base64 ל-Buffer
 */
function base64ToBuffer(base64String) {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
}

/**
 * דחיסת תמונה עם Sharp
 */
async function compressImage(base64String, options = {}) {
    try {
        const { maxWidth = 1200, maxHeight = 1200, quality = 80 } = options;

        // המרה ל-Buffer
        const buffer = base64ToBuffer(base64String);

        // דחיסה עם Sharp
        const compressedBuffer = await sharp(buffer)
            .resize(maxWidth, maxHeight, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality, progressive: true })
            .toBuffer();

        // המרה חזרה ל-Base64
        const compressedBase64 = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;

        const originalSize = buffer.length;
        const compressedSize = compressedBuffer.length;
        const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);

        return {
            compressed: compressedBase64,
            originalSize,
            compressedSize,
            savings
        };
    } catch (error) {
        console.error('Error compressing image:', error.message);
        return null;
    }
}

/**
 * דחיסת תמונות פרופיל של עובדים
 */
async function compressProfileImages() {
    console.log('\n📸 מדחיס תמונות פרופיל...\n');

    try {
        // שליפת כל העובדים עם תמונות
        const result = await pool.query(
            'SELECT id, first_name, last_name, profile_image FROM employees WHERE profile_image IS NOT NULL'
        );

        console.log(`נמצאו ${result.rows.length} עובדים עם תמונות פרופיל`);

        let totalOriginalSize = 0;
        let totalCompressedSize = 0;
        let successCount = 0;

        for (const employee of result.rows) {
            const { id, first_name, last_name, profile_image } = employee;

            // דלג על תמונות שכבר דחוסות (קטנות מ-100KB)
            const currentSize = Buffer.byteLength(profile_image, 'utf8');
            if (currentSize < 100 * 1024) {
                console.log(`⏭️  ${first_name} ${last_name}: כבר דחוס (${(currentSize / 1024).toFixed(2)}KB)`);
                continue;
            }

            console.log(`🔄 מדחיס: ${first_name} ${last_name}...`);

            const result = await compressImage(profile_image, {
                maxWidth: 800,
                maxHeight: 800,
                quality: 80
            });

            if (result) {
                // עדכון בדאטאבייס
                await pool.query(
                    'UPDATE employees SET profile_image = $1 WHERE id = $2',
                    [result.compressed, id]
                );

                totalOriginalSize += result.originalSize;
                totalCompressedSize += result.compressedSize;
                successCount++;

                console.log(`   ✅ ${(result.originalSize / 1024).toFixed(2)}KB → ${(result.compressedSize / 1024).toFixed(2)}KB (חיסכון: ${result.savings}%)`);
            }
        }

        console.log(`\n✨ סיכום תמונות פרופיל:`);
        console.log(`   עובדים עודכנו: ${successCount}`);
        console.log(`   גודל מקורי: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   גודל דחוס: ${(totalCompressedSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   חיסכון כולל: ${((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(1)}%`);

    } catch (error) {
        console.error('❌ שגיאה בדחיסת תמונות פרופיל:', error.message);
    }
}

/**
 * דחיסת תעודות כיול
 */
async function compressCertificates() {
    console.log('\n📄 מדחיס תעודות כיול...\n');

    try {
        // שליפת כל התעודות עם קבצים
        const result = await pool.query(
            `SELECT c.id, c.name, c.certificate, e.first_name, e.last_name 
             FROM certifications c 
             JOIN employees e ON c.employee_id = e.id 
             WHERE c.certificate IS NOT NULL AND c.certificate LIKE 'data:image%'`
        );

        console.log(`נמצאו ${result.rows.length} תעודות עם תמונות`);

        let totalOriginalSize = 0;
        let totalCompressedSize = 0;
        let successCount = 0;

        for (const cert of result.rows) {
            const { id, name, certificate, first_name, last_name } = cert;

            // דלג על תעודות שכבר דחוסות
            const currentSize = Buffer.byteLength(certificate, 'utf8');
            if (currentSize < 200 * 1024) {
                console.log(`⏭️  ${first_name} ${last_name} - ${name}: כבר דחוס (${(currentSize / 1024).toFixed(2)}KB)`);
                continue;
            }

            console.log(`🔄 מדחיס: ${first_name} ${last_name} - ${name}...`);

            const result = await compressImage(certificate, {
                maxWidth: 1600,
                maxHeight: 1600,
                quality: 85
            });

            if (result) {
                // עדכון בדאטאבייס
                await pool.query(
                    'UPDATE certifications SET certificate = $1 WHERE id = $2',
                    [result.compressed, id]
                );

                totalOriginalSize += result.originalSize;
                totalCompressedSize += result.compressedSize;
                successCount++;

                console.log(`   ✅ ${(result.originalSize / 1024).toFixed(2)}KB → ${(result.compressedSize / 1024).toFixed(2)}KB (חיסכון: ${result.savings}%)`);
            }
        }

        console.log(`\n✨ סיכום תעודות:`);
        console.log(`   תעודות עודכנו: ${successCount}`);
        console.log(`   גודל מקורי: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   גודל דחוס: ${(totalCompressedSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   חיסכון כולל: ${((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(1)}%`);

    } catch (error) {
        console.error('❌ שגיאה בדחיסת תעודות:', error.message);
    }
}

/**
 * דחיסת תעודות צב״דים
 */
async function compressEquipmentCertificates() {
    console.log('\n🔧 מדחיס תעודות צב״דים...\n');

    try {
        // שליפת כל תעודות הצב״דים
        const result = await pool.query(
            'SELECT id, name, certificate FROM equipment WHERE certificate IS NOT NULL AND certificate LIKE \'data:image%\''
        );

        console.log(`נמצאו ${result.rows.length} תעודות צב״דים עם תמונות`);

        let totalOriginalSize = 0;
        let totalCompressedSize = 0;
        let successCount = 0;

        for (const equipment of result.rows) {
            const { id, name, certificate } = equipment;

            const currentSize = Buffer.byteLength(certificate, 'utf8');
            if (currentSize < 200 * 1024) {
                console.log(`⏭️  ${name}: כבר דחוס (${(currentSize / 1024).toFixed(2)}KB)`);
                continue;
            }

            console.log(`🔄 מדחיס: ${name}...`);

            const result = await compressImage(certificate, {
                maxWidth: 1600,
                maxHeight: 1600,
                quality: 85
            });

            if (result) {
                await pool.query(
                    'UPDATE equipment SET certificate = $1 WHERE id = $2',
                    [result.compressed, id]
                );

                totalOriginalSize += result.originalSize;
                totalCompressedSize += result.compressedSize;
                successCount++;

                console.log(`   ✅ ${(result.originalSize / 1024).toFixed(2)}KB → ${(result.compressedSize / 1024).toFixed(2)}KB (חיסכון: ${result.savings}%)`);
            }
        }

        console.log(`\n✨ סיכום תעודות צב״דים:`);
        console.log(`   תעודות עודכנו: ${successCount}`);
        console.log(`   גודל מקורי: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   גודל דחוס: ${(totalCompressedSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   חיסכון כולל: ${((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(1)}%`);

    } catch (error) {
        console.error('❌ שגיאה בדחיסת תעודות צב״דים:', error.message);
    }
}

/**
 * הרצת כל הדחיסות
 */
async function main() {
    console.log('🚀 מתחיל דחיסת תמונות קיימות...\n');
    console.log('⚠️  זה עלול לקחת כמה דקות, אל תסגור את החלון!\n');

    try {
        await compressProfileImages();
        await compressCertificates();
        await compressEquipmentCertificates();

        console.log('\n🎉 הדחיסה הושלמה בהצלחה!\n');
    } catch (error) {
        console.error('\n❌ שגיאה כללית:', error.message);
    } finally {
        await pool.end();
    }
}

// הרצה
main();

