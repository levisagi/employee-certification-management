# 🚀 Employee Certification Management - Server

שרת Node.js עם Express ו-PostgreSQL (Supabase) לניהול הסמכות עובדים.

## 📋 דרישות מקדימות

- Node.js (גרסה 14 ומעלה)
- חשבון Supabase (חינם)
- npm או yarn

## 🔧 התקנה

1. **התקן את התלויות:**
   ```bash
   cd server
   npm install
   ```

2. **הגדר את Supabase:**
   - עקוב אחר ההוראות ב-`SUPABASE_SETUP.md`
   - צור פרויקט חדש ב-[Supabase](https://supabase.com)
   - הרץ את `schema.sql` ב-SQL Editor
   - העתק את ה-Connection String

3. **צור קובץ .env:**
   ```bash
   # העתק את env.example.txt
   cp env.example.txt .env
   
   # ערוך את .env והוסף את ה-Connection String שלך
   nano .env
   ```

4. **הוסף את ה-Connection String:**
   ```env
   DATABASE_URL=postgresql://postgres.YOUR_PROJECT:YOUR_PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres
   PORT=5001
   NODE_ENV=development
   ```

## 🚀 הרצת השרת

### מצב רגיל:
```bash
npm start
```

### מצב פיתוח (עם auto-reload):
```bash
npm run dev
```

השרת ירוץ על `http://localhost:5001`

## 📡 API Endpoints

### עובדים

- **GET** `/api/employees` - קבלת כל העובדים
- **GET** `/api/employees/:id` - קבלת עובד בודד
- **POST** `/api/employees` - יצירת עובד חדש
- **PUT** `/api/employees/:id` - עדכון עובד
- **DELETE** `/api/employees/:id` - מחיקת עובד

### הסמכות

- **POST** `/api/employees/copy-certifications` - העתקת הסמכות בין עובדים

### בריאות

- **GET** `/api/health` - בדיקת סטטוס השרת

## 🗄️ מבנה מסד הנתונים

### טבלאות:

1. **employees** - פרטי עובדים
   - id, employee_number, first_name, last_name
   - phone_number, email, role, department
   - start_date, profile_image
   - created_at, updated_at

2. **certifications** - הסמכות עובדים
   - id, employee_id (FK)
   - name, issue_date, expiry_date
   - start_date, end_date, status
   - is_required, certificate, certificate_file_name
   - created_at, updated_at

3. **ojt_records** - רישומי OJT (On-the-Job Training)
   - id, certification_id (FK)
   - ojt_number (1 או 2)
   - mentor, date
   - created_at

## 📁 מבנה הקבצים

```
server/
├── server.js              # נקודת הכניסה הראשית
├── database.js            # חיבור ל-PostgreSQL
├── models/
│   └── EmployeeModel.js   # מודל עובדים
├── schema.sql             # סכמת הטבלאות
├── package.json           # תלויות
├── .env                   # הגדרות סביבה (לא במאגר!)
├── env.example.txt        # דוגמה להגדרות
├── SUPABASE_SETUP.md      # הוראות הגדרה
└── README.md              # הקובץ הזה
```

## 🔒 אבטחה

- **אל תעלה את קובץ .env למאגר Git!**
- השתמש בסיסמאות חזקות
- ה-SSL מופעל אוטומטית עם Supabase
- השתמש ב-Connection Pooling (פורט 6543)

## 🐛 פתרון בעיות

### שגיאת חיבור למסד נתונים
```
Error: Connection refused
```
**פתרון:**
- בדוק את ה-Connection String ב-.env
- ודא שהחלפת `[YOUR-PASSWORD]` בסיסמה האמיתית
- בדוק שאתה משתמש ב-Connection Pooling

### טבלאות לא קיימות
```
Error: relation "employees" does not exist
```
**פתרון:**
- הרץ את `schema.sql` ב-Supabase SQL Editor
- בדוק ב-Table Editor שהטבלאות נוצרו

### סיסמה שגויה
```
Error: password authentication failed
```
**פתרון:**
- אפס את הסיסמה ב-Supabase: Settings -> Database -> Reset Password
- עדכן את קובץ .env עם הסיסמה החדשה

## 📊 ניטור

- **Supabase Dashboard:** צפייה בנתונים, לוגים ושאילתות
- **Table Editor:** עריכה ישירה של הנתונים
- **Database Logs:** מעקב אחר כל השאילתות

## 🔄 מעבר מ-MongoDB

אם היית משתמש ב-MongoDB קודם:

1. ✅ mongoose הוסר
2. ✅ pg (PostgreSQL) הותקן
3. ✅ המודלים הומרו ל-SQL queries
4. ✅ הסכמה נוצרה ב-schema.sql

**לא צריך לעשות כלום נוסף!**

## 📚 משאבים נוספים

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node-Postgres (pg) Documentation](https://node-postgres.com/)

## 💡 טיפים

1. השתמש ב-`npm run dev` בפיתוח לעדכון אוטומטי
2. בדוק את הלוגים בקונסול לפתרון בעיות
3. השתמש ב-Supabase Table Editor לצפייה בנתונים
4. גיבוי אוטומטי פעיל ב-Supabase (7 ימים בתוכנית חינמית)

---

**נוצר עם ❤️ לניהול הסמכות עובדים**

