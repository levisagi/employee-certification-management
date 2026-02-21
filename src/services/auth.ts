// src/services/auth.ts

export interface User {
    username: string;
    fullName?: string;
    email?: string;
    // הוסף שדות נוספים כנדרש
  }
  
  export interface LoginResult {
    success: boolean;
    user?: User;
    error?: string;
    token?: string;
  }
  
  // מערך משתמשים לצורך הדגמה
  // במערכת אמיתית, זה יהיה בשרת
  const DEMO_USERS = [
    {
      username: 'admin',
      password: 'admin123',
      fullName: 'מנהל מערכת',
      email: 'admin@example.com'
    },
    {
      username: 'user',
      password: 'user123',
      fullName: 'משתמש רגיל',
      email: 'user@example.com'
    }
  ];
  
  /**
   * פונקציה המאמתת משתמש - כניסה חופשית ללא אימות
   */
  export const login = async (username: string, password: string): Promise<LoginResult> => {
    // הדמיית השהייה קצרה
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      // כניסה חופשית ללא בדיקת סיסמה
      const userInfo: User = {
        username: 'guest',
        fullName: 'משתמש אורח',
        email: 'guest@system.com'
      };
      
      // שמירת המידע בlocal storage
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('isAuthenticated', 'true');
      
      // החזרת תוצאה חיובית תמיד
      return {
        success: true,
        user: userInfo,
        token: 'guest-token-' + Math.random().toString(36).substr(2)
      };
    } catch (error) {
      console.error('Error during login:', error);
      return {
        success: false,
        error: 'אירעה שגיאה במהלך ההתחברות'
      };
    }
  };
  
  /**
   * פונקציה המנתקת את המשתמש מהמערכת
   */
  export const logout = (): void => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
  };
  
  /**
   * פונקציה הבודקת אם המשתמש מחובר
   */
  export const isAuthenticated = (): boolean => {
    return localStorage.getItem('isAuthenticated') === 'true';
  };
  
  /**
   * פונקציה המחזירה את פרטי המשתמש המחובר
   */
  export const getCurrentUser = (): User | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr) as User;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };
  
  /**
   * פונקציה לשינוי סיסמה
   * במערכת אמיתית זה יהיה API call לשרת
   */
  export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    // הדמיית השהייה של קריאת רשת
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // בהדגמה, נמיר תמיד בהצלחה
    return {
      success: true
    };
  };