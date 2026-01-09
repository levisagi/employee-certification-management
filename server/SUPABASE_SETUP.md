# 🚀 הוראות הגדרת Supabase

## שלב 1: יצירת פרויקט ב-Supabase

1. **היכנס ל-Supabase**
   - גש ל-[https://supabase.com](https://supabase.com)
   - התחבר או צור חשבון חדש (חינם!)

2. **צור פרויקט חדש**
   - לחץ על "New Project"
   - בחר שם לפרויקט (לדוגמה: `employee-certification`)
   - בחר סיסמה חזקה למסד הנתונים (**שמור אותה!**)
   - בחר אזור (Region) - מומלץ הקרוב ביותר אליך
   - לחץ "Create new project"
   - המתן כ-2 דקות עד שהפרויקט יהיה מוכן

## שלב 2: יצירת הטבלאות

1. **פתח את SQL Editor**
   - בתפריט הצד, לחץ על "SQL Editor"
   - לחץ על "+ New query"

2. **הרץ את הסכמה**
   - פתח את הקובץ `schema.sql` שנמצא בתיקיית `server/`
   - העתק את כל התוכן
   - הדבק ב-SQL Editor
   - לחץ "Run" (או Ctrl/Cmd + Enter)
   - אמור להופיע הודעה: "Success. No rows returned"

3. **בדוק שהטבלאות נוצרו**
   - בתפריט הצד, לחץ על "Table Editor"
   - אמורות להופיע 3 טבלאות:
     - `employees`
     - `certifications`
     - `ojt_records`

## שלב 3: קבלת Connection String

1. **פתח הגדרות Database**
   - בתפריט הצד, לחץ על "Settings" (גלגל השיניים)
   - לחץ על "Database"

2. **העתק את ה-Connection String**
   - גלול למטה ל-"Connection string"
   - **חשוב:** בחר "Connection pooling" (לא "Direct connection")
   - בחר "URI"
   - תראה משהו כזה:
     ```
     postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
     ```
   - לחץ על "Copy" כדי להעתיק
   - **שים לב:** תצטרך להחליף `[YOUR-PASSWORD]` בסיסמה האמיתית שיצרת בשלב 1

## שלב 4: הגדרת קובץ .env

1. **צור קובץ .env**
   - בתיקיית `server/`, צור קובץ חדש בשם `.env`
   - העתק את התוכן מ-`.env.example`

2. **הדבק את ה-Connection String**
   ```env
   DATABASE_URL=postgresql://postgres.abcdefghijklmnop:YOUR_ACTUAL_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   PORT=5001
   NODE_ENV=development
   ```
   
   **החלף:**
   - `[YOUR-PASSWORD]` בסיסמה האמיתית שלך
   - או העתק את כל השורה מ-Supabase והחלף את `[YOUR-PASSWORD]`

3. **שמור את הקובץ**

## שלב 5: הרצת השרת

1. **התקן את התלויות** (אם עוד לא עשית)
   ```bash
   cd server
   npm install
   ```

2. **הרץ את השרת**
   ```bash
   npm start
   ```
   או מתיקיית הפרויקט הראשית:
   ```bash
   npm run server
   ```

3. **בדוק שהחיבור עובד**
   - אמורה להופיע הודעה:
     ```
     ✓ Connected to PostgreSQL database
     ✓ Database connection successful
     Server is running on port 5001
     Database: PostgreSQL (Supabase)
     ```

## שלב 6: בדיקת החיבור

1. **פתח דפדפן וגש ל:**
   ```
   http://localhost:5001/api/health
   ```
   
   אמור להופיע:
   ```json
   {
     "status": "ok",
     "message": "Server is running",
     "timestamp": "2024-..."
   }
   ```

2. **בדוק שאין עובדים (עדיין)**
   ```
   http://localhost:5001/api/employees
   ```
   
   אמור להופיע:
   ```json
   []
   ```

## 🎉 סיימת!

המערכת שלך עכשיו מחוברת ל-Supabase!

---

## 📝 טיפים נוספים

### הצגת הנתונים ב-Supabase
- לחץ על "Table Editor" כדי לראות את הנתונים בטבלאות
- תוכל לערוך, למחוק ולהוסיף שורות ישירות מהממשק

### גיבוי אוטומטי
- Supabase עושה גיבוי אוטומטי של המסד שלך
- בתוכנית החינמית: גיבוי יומי ל-7 ימים אחורה

### מעקב אחר שאילתות
- לחץ על "Logs" -> "Database" כדי לראות את כל השאילתות שרצות

### הגבלות תוכנית חינמית
- 500MB מקום
- 2GB העברת נתונים
- מספיק למערכת קטנה-בינונית

### אבטחה
- אל תשתף את קובץ ה-.env
- אל תעלה אותו ל-GitHub
- השתמש בסיסמאות חזקות

---

## ⚠️ פתרון בעיות נפוצות

### שגיאת "Connection refused"
- בדוק שה-Connection String נכון
- ודא שהחלפת `[YOUR-PASSWORD]` בסיסמה האמיתית
- בדוק שאתה משתמש ב-Connection Pooling (פורט 6543)

### שגיאת "relation does not exist"
- הרץ שוב את `schema.sql` ב-SQL Editor
- ודא שהטבלאות נוצרו ב-Table Editor

### שגיאת "password authentication failed"
- הסיסמה שגויה
- אפשר לאפס סיסמה ב-Settings -> Database -> Reset Database Password

### השרת לא מתחבר
- בדוק שקובץ `.env` נמצא בתיקיית `server/`
- ודא שאין רווחים מיותרים ב-Connection String
- נסה להריץ `npm install pg` שוב





