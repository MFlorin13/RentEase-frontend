import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ToastProvider } from './components/Context/ToastContext/ToastContext';
import { FavoriteProvider } from './components/Context/FavoriteContext/FavoriteContext';
import { ThemeProvider } from './components/Context/ThemeContext/ThemeContext';
import { AuthProvider } from './components/Auth/Auth';
import { ProtectedRoute } from './components/ProtectedRoutes/ProtectedRoutes';
import AppLayout from './components/AppLayout/AppLayout';
import AddFlat from './components/Flats/AddFlat/AddFlat';
import Register from './components/Register/Register';
import Login from './components/Login/Login';
import MyFlats from './components/Flats/MyFLats/Myflats';
import AdminPage from './components/Admin/AdminPage/AdminPage';
import AllFlats from './components/Flats/AllFlats/AllFlats';
import FavoritesPage from './components/FavoritesPage/FavoritesPage';
import UpdateProfile from './components/UpdateProfile/UpdateProfile';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';
import ResetPassword from './components/ResetPassword/ResetPassword';
import NotFound from './components/PageNotFound/PageNotFound';
import MessagingPage from './components/MessagingPage/MessagingPage';
import './styles/global.css';
import './styles/darkMode.css';


const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <AllFlats />
          </ProtectedRoute>
        )
      },
      { path: '/register', element: <Register /> },
      { path: '/login', element: <Login /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password-code', element: <ResetPassword /> },
      { path: '*', element: <NotFound /> },
      {
        path: '/my-flats',
        element: (
          <ProtectedRoute>
            <MyFlats />
          </ProtectedRoute>
        )
      },
      {
        path: '/add-flat',
        element: (
          <ProtectedRoute>
            <AddFlat />
          </ProtectedRoute>
        )
      },
      {
        path: '/admin',
        element: (
          <ProtectedRoute adminRequired={true}>
            <AdminPage />
          </ProtectedRoute>
        )
      },
      {
        path: '/favorites',
        element: (
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        )
      },
      {
        path: '/profile',
        element: (
          <ProtectedRoute>
            <UpdateProfile />
          </ProtectedRoute>
        )
      },
      {
  path: '/flat/:flatId/messages',
  element: (
    <ProtectedRoute>
      <MessagingPage />
    </ProtectedRoute>
  )
},
{
  path: '/owner-messages',
  element: (
    <ProtectedRoute>
      <MessagingPage />
    </ProtectedRoute>
  )
},
{
  path: '/messages/:flatId?',
  element: (
    <ProtectedRoute>
      <MessagingPage />
    </ProtectedRoute>
  )
},
    ],
  },
]);

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <FavoriteProvider>
            <RouterProvider router={router} />
          </FavoriteProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;