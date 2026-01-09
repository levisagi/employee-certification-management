# מדריך העלאה ל-DigitalOcean App Platform

## שלב 1: הכנת הקוד

1. וודא שכל הקבצים מעודכנים:
```bash
git add .
git commit -m "Prepare for DigitalOcean deployment"
git push origin main
```

## שלב 2: יצירת אפליקציה חדשה ב-DigitalOcean

### אופן א': דרך ממשק האינטרנט

1. היכנס ל-[DigitalOcean Console](https://cloud.digitalocean.com)
2. לחץ על **Apps** בתפריט הצד
3. לחץ על **Create App**
4. בחר את ה-GitHub repository שלך
5. בחר את הענף **main**

### הגדרות האפליקציה:

#### Build & Deploy Settings:
- **Build Command**: `npm install && npm run build`
- **Run Command**: `npm start`
- **HTTP Port**: `8080`

או עם Docker:
- בחר **Dockerfile**
- **Dockerfile Path**: `Dockerfile`
- **HTTP Port**: `3000`

#### Environment Variables:

הוסף את משתני הסביבה הבאים (Settings > App-Level Environment Variables):

```
DATABASE_URL=postgresql://postgres.xxxx:xxxx@aws-0-us-east-1.pooler.supabase.com:6543/postgres
PORT=8080
NODE_ENV=production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password_here
```

⚠️ **חשוב**: העתק את `DATABASE_URL` המלא מ-Supabase (עם הסיסמה)

## שלב 3: Deploy

1. לחץ על **Next**
2. בחר את ה-Plan המתאים (Basic - $5/month)
3. לחץ על **Create Resources**

## שלב 4: פתרון בעיות נפוצות

### שגיאה: "Container exited with non-zero exit code"

**פתרון 1**: בדוק את ה-Logs
```
Runtime Logs > Application Logs
```

**פתרון 2**: וודא משתני סביבה
- DATABASE_URL נכון ומכיל את הסיסמה
- PORT מוגדר נכון
- השרת Supabase פעיל (לא ב-Pause)

**פתרון 3**: שנה את ה-Health Check
```
Settings > Health Checks
HTTP Path: /
Port: 3000 (או 8080)
```

### שגיאה: "Build failed"

**פתרון**: בדוק שיש קובץ `package-lock.json` ב-Git:
```bash
git add package-lock.json
git commit -m "Add package-lock"
git push
```

### שגיאה: "Cannot connect to database"

**פתרונות**:
1. בדוק שהשרת Supabase פעיל (Settings > Database Settings)
2. וודא שה-IP של DigitalOcean מאושר ב-Supabase
3. נסה להחליף את הפורט מ-6543 ל-5432 ב-DATABASE_URL

## שלב 5: עדכונים עתידיים

אחרי כל שינוי בקוד:
```bash
git add .
git commit -m "תיאור השינוי"
git push
```

DigitalOcean ידאג לבנות ולפרוס אוטומטית!

## בדיקה מקומית לפני העלאה

```bash
# בנה את הפרויקט
npm run build

# הרץ בייצור מקומי
npm start
```

## קישורים שימושיים

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Supabase Connection Strings](https://supabase.com/docs/guides/database/connecting-to-postgres)

---

## טיפים

1. **Logs הם החבר הכי טוב שלך** - תמיד בדוק את ה-Runtime Logs כשיש בעיה
2. **Environment Variables** - וודא שהם מוגדרים ב-App Settings ולא רק בקוד
3. **Database Connection** - השתמש ב-pooler connection (port 6543) לביצועים טובים יותר
4. **Cost** - האפליקציה תעלה כ-$5-12 לחודש בהתאם ל-Plan

בהצלחה! 🚀

