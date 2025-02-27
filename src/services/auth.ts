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
   * פונקציה המאמתת משתמש לפי שם וסיסמה
   * במערכת אמיתית זה יהיה API call לשרת
   */
  export const login = async (username: string, password: string): Promise<LoginResult> => {
    // הדמיית השהייה של קריאת רשת
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      // חיפוש המשתמש במערך ההדגמה
      const user = DEMO_USERS.find(u => u.username === username && u.password === password);
      
      if (user) {
        // יצירת מידע משתמש ללא הסיסמה
        const userInfo: User = {
          username: user.username,
          fullName: user.fullName,
          email: user.email
        };
        
        // שמירת המידע בlocal storage
        localStorage.setItem('user', JSON.stringify(userInfo));
        localStorage.setItem('isAuthenticated', 'true');
        
        // החזרת תוצאה חיובית
        return {
          success: true,
          user: userInfo,
          token: 'dummy-jwt-token-' + Math.random().toString(36).substr(2)
        };
      }
      
      // המשתמש לא נמצא
      return {
        success: false,
        error: 'שם משתמש או סיסמה שגויים'
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