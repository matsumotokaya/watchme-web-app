import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUserProfile } from '../services/userService';

// 認証コンテキスト
const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初期認証状態を取得
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user ?? null;
      setUser(authUser);
      
      // 認証ユーザーがいる場合、プロフィール情報も取得
      if (authUser) {
        const profile = await getCurrentUserProfile(authUser.id);
        setUserProfile(profile);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('認証状態変更:', event, session?.user?.email);
        const authUser = session?.user ?? null;
        setUser(authUser);
        
        if (authUser) {
          // ログイン時にプロフィール情報を取得
          const profile = await getCurrentUserProfile(authUser.id);
          setUserProfile(profile);
        } else {
          // ログアウト時にプロフィール情報をクリア
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUserProfile(null);
    }
    return { error };
  };

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await getCurrentUserProfile(user.id);
      setUserProfile(profile);
      return profile;
    }
    return null;
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signOut,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};