import { onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, UserCredential, signInWithPopup, updateProfile, updateEmail, updatePassword, } from 'firebase/auth'
import { createContext, useContext, useEffect, useState } from 'react'
import { auth, firestore, googleProvider } from '../utils/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DefaultPageProps } from '../types/shell'
import { defaultUsermeta } from '../utils/globals';


interface BasicProfileData {
  displayName?: string | null | undefined;
  photoURL?: string | null | undefined;
  email?: string
  password?: string
}

interface AuthContext {
  user: User | null,
  loading: boolean,
  login: (email: string, password: string) => Promise<UserCredential>,
  signup: (email: string, password: string) => Promise<UserCredential>,
  logout: () => void
  loginWithGoogle: () => Promise<UserCredential>
  updateUserProfile: (data: BasicProfileData) => void
}

const AuthContext = createContext<AuthContext>({} as AuthContext)

export const AuthContextProvider = ({ children }: DefaultPageProps) => {

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Watch the user changes.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  /**
   * Create a firestore usermeta database entry with information based on the created user.
   * 
   * @param user The created user.
   * @returns setDoc() promise.
   */
  const buildUserMetaEntry = async (user: User) => {
    const { email, displayName } = user
    const ref = doc(firestore, "usermetas", user.uid);
    return await setDoc(ref, {
      ...defaultUsermeta,
      email,
      displayName,
      registrationDate: new Date()
    }, { merge: true });
  }

  /**
   * Create a new user account.
   * Wrapper for the firebase function createUserWithEmailAndPassword().
   * 
   * @param email The new user email address.
   * @param password The new user password.
   * @returns A promise returning an UserCredential.
   */
  const signup = async (email: string, password: string): Promise<UserCredential> => {
    const promise = await createUserWithEmailAndPassword(auth, email, password)
    buildUserMetaEntry(promise.user)
    return promise
  }

  /**
   * Authenticate an existing user.
   * Wrapper for the firebase function signInWithEmailAndPassword().
   * 
   * @param email The user email address.
   * @param password The user password.
   * @returns
   */
  const login = async (email: string, password: string): Promise<UserCredential> => {
    return await signInWithEmailAndPassword(auth, email, password)
  }

  /**
   * Log out the currently authenticated user.
   * Wrapper for the firebase function signOut().
   * 
   * @returns 
   */
  const logout = async (): Promise<void> => {
    setUser(null)
    return await signOut(auth)
  }

  /**
   * Login or create an account using google.
   * 
   * @returns 
   */
  const loginWithGoogle = async (): Promise<UserCredential> => {
    const cred = await signInWithPopup(auth, googleProvider);
    // creating the meta
    const docRef = doc(firestore, "usermetas", cred.user.uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      buildUserMetaEntry(cred.user)
    }
    return cred;
  }

  /**
   * Update the displayName or photoURL of the current user.
   * 
   * @returns 
   */
  const updateUserProfile = async (data: BasicProfileData) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: data.displayName, photoURL: data.photoURL });
      if (data.email) {
        await updateEmail(auth.currentUser, data.email);
      }
      if (data.password) {
        await updatePassword(auth.currentUser, data.password);
      }
      setUser({ ...user, ...data } as User)
    }
    return null;
  }

  const contextValues: AuthContext = {
    user,
    loading,
    login,
    signup,
    logout,
    loginWithGoogle,
    updateUserProfile
  }

  return (
    <AuthContext.Provider value={contextValues}>
      {loading ? null : children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)