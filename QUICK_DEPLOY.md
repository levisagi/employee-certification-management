# 🚀 מדריך מהיר להעלאה ל-DigitalOcean

## שלב 1: Push ל-GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## שלב 2: צור App ב-DigitalOcean

1. לך ל: https://cloud.digitalocean.com/apps
2. לחץ **Create App**
3. בחר את ה-Repository שלך מ-GitHub
4. בחר ענף: **main**

## שלב 3: הגדרות Build

בחר אחת מהאפשרויות הבאות:

### אופציה A: ללא Docker (מומלץ)

**Resource Type**: Web Service

**Build Settings**:
- Build Command: `npm install && npm run build`
- Run Command: `npm start`
- HTTP Port: `8080`

### אופציה B: עם Docker

**Resource Type**: Web Service (Dockerfile)

**Build Settings**:
- Dockerfile Path: `Dockerfile`
- HTTP Port: `3000`

## שלב 4: Environment Variables

לחץ על **Edit** ליד Environment Variables והוסף:

```
DATABASE_URL = [העתק מ-Supabase]
PORT = 8080
NODE_ENV = production
```

**איך למצוא את DATABASE_URL?**
1. לך ל-Supabase Dashboard
2. Settings > Database
3. Connection String > URI
4. העתק את כל השורה (כולל הסיסמה!)

## שלב 5: Deploy!

1. לחץ **Next**
2. בחר **Basic Plan** ($5/חודש)
3. לחץ **Create Resources**
4. המתן 5-10 דקות

## ✅ זהו! האפליקציה שלך אמורה לרוץ

---

## ❌ אם יש שגיאה

### בעיה: "Build failed"

**פתרון**:
```bash
# בדוק שיש package-lock.json
git add package-lock.json server/package-lock.json
git commit -m "Add lock files"
git push
```

### בעיה: "Container exited"

**פתרון**:
1. לך ל-**Runtime Logs**
2. חפש את השורה עם השגיאה
3. בדוק ש-DATABASE_URL נכון
4. וודא ש-Supabase לא ב-Pause

### בעיה: "Cannot connect to database"

**פתרון**:
1. לך ל-Supabase Dashboard
2. Settings > Pause/Resume
3. לחץ **Resume**
4. חזור ל-DigitalOcean ולחץ **Redeploy**

---

## 📞 צריך עזרה?

בדוק את:
- [DIGITALOCEAN_SETUP.md](./DIGITALOCEAN_SETUP.md) - מדריך מפורט
- [DigitalOcean Docs](https://docs.digitalocean.com/products/app-platform/)

בהצלחה! 🎉

