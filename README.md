# Smart Shopping Notification Server

שרת Node.js לניהול תזמון נוטיפיקציות יומיות עבור אפליקציית Smart Shopping.

## 🚀 פריסה ב-Render

### 1. יצירת Repository ב-GitHub

1. צור repository חדש ב-GitHub בשם `smart-shopping-notification-server`
2. העלה את הקבצים הבאים:
   - `package.json`
   - `server.js`
   - `env.example`
   - `README.md`

### 2. יצירת שירות ב-Render

1. היכנס ל-[Render Dashboard](https://dashboard.render.com)
2. לחץ על "New +" ובחר "Web Service"
3. חבר את ה-GitHub repository שלך
4. הגדר את הפרטים הבאים:

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

**Environment Variables:**
```
SUPABASE_URL=https://urbtxtmgdysiltfzvewm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
PORT=3000
NODE_ENV=production
TZ=Asia/Jerusalem
```

### 3. קבלת Service Role Key

1. היכנס ל-Supabase Dashboard
2. לך ל-Settings > API
3. העתק את ה-Service Role Key
4. הדבק אותו ב-Environment Variables ב-Render

## 🔧 בדיקה מקומית

### התקנה
```bash
npm install
```

### הגדרת משתני סביבה
```bash
cp env.example .env
# ערוך את .env עם הפרטים האמיתיים שלך
```

### הרצה מקומית
```bash
npm run dev
```

## 📡 Endpoints

### Health Check
```bash
curl https://your-service.onrender.com/health
```

### Manual Trigger (לבדיקות)
```bash
curl -X POST https://your-service.onrender.com/trigger-notifications
```

## ⏰ איך זה עובד

1. **Cron Job** רץ כל דקה
2. **בודק זמן** - השעה הנוכחית בישראל
3. **מושך משתמשים** מ-Supabase עם הגדרות נוטיפיקציות
4. **מסנן משתמשים** שצריכים לקבל נוטיפיקציה עכשיו
5. **שולח נוטיפיקציות** דרך Edge Function הקיים
6. **מתעד** את הניסיונות ב-Supabase

## 🔍 בדיקת תקינות

### 1. בדוק שהשרת עובד
```bash
curl https://your-service.onrender.com/health
```

### 2. בדוק שליחה ידנית
```bash
curl -X POST https://your-service.onrender.com/trigger-notifications
```

### 3. בדוק לוגים ב-Render
- היכנס ל-Dashboard של השירות
- לחץ על "Logs"
- חפש הודעות כמו "Cron job triggered"

## 🛡️ אבטחה

- משתמש ב-Service Role Key של Supabase
- לא חושף מידע רגיש
- Logging מפורט לניטור
- Error handling מקיף

## 🔧 פתרון בעיות

### השרת לא עולה
- בדוק את משתני הסביבה
- בדוק את ה-Build Command
- בדוק את ה-Start Command

### נוטיפיקציות לא נשלחות
- בדוק את ה-SUPABASE_SERVICE_ROLE_KEY
- בדוק את ה-SUPABASE_URL
- בדוק את הלוגים ב-Render

### בעיות זמן
- השרת מוגדר לזמן ישראל
- בדוק את משתנה TZ
- בדוק את הלוגים לזמן מדויק "# smart-shopping-notification-server" 
