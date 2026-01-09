# הוראות פריסה ל-DigitalOcean

## שלבים לפריסה:

### 1. הגדרת משתני סביבה ב-DigitalOcean

לך ל-App Settings > Environment Variables והוסף:

```
DATABASE_URL=postgresql://your-connection-string
PORT=8080
NODE_ENV=production
```

### 2. עדכון package.json

ודא שיש סקריפטים:
```json
{
  "scripts": {
    "start": "serve -s build -l $PORT",
    "build": "react-scripts build",
    "server": "cd server && node server.js"
  }
}
```

### 3. Push ל-GitHub

```bash
git add .
git commit -m "Added DigitalOcean deployment files"
git push
```

### 4. פתרון בעיות נפוצות

אם יש שגיאה "container exited with non-zero exit code":

1. בדוק שמשתני הסביבה מוגדרים
2. בדוק ש-DATABASE_URL תקין
3. בדוק שהפורט 8080 פתוח
4. ודא שיש serve מותקן: `npm install -g serve`

### 5. הרצה מקומית לבדיקה

```bash
# בנה את האפליקציה
npm run build

# הרץ את השרת
cd server && node server.js &

# הגש את הבנייה
serve -s build -l 8080
```

## מבנה הפרויקט

```
my-typescript-project/
├── src/                    # React frontend
├── server/                 # Node.js backend
├── build/                  # Built frontend (after npm run build)
├── Dockerfile             # Docker configuration
├── .dockerignore          # Files to ignore in Docker
└── .do/
    └── app.yaml           # DigitalOcean App Platform config
```

## טיפים

- ודא שהשרת מאזין לפורט מ-process.env.PORT
- ודא שיש חיבור תקין ל-Supabase
- בדוק logs ב-DigitalOcean Console

