Ready to use custom [Next.js](https://nextjs.org/) app shell packing :
- Mantine UI based app shell
- Login and account creation using `@firebase/auth` with the `AuthContext`
- Data hooks using `@firebase/database` with the `DatabaseContext`

# Getting started

## 1. Create a firebase account 
and enable :

    - The `Authentication` (with Email and Google)
    - The `Reatime Database`
    - The `Storage`

## 2. Set your firebase config details 
in a `firebaseConfig.json` file at the root of the project. The content of this file should have this structure:
```json
{
  "apiKey": "",
  "authDomain": "",
  "databaseURL": "",
  "projectId": "",
  "storageBucket": "",
  "messagingSenderId": "",
  "appId": ""
}
```
## 3. Listen to the `Realtime Database` collections
Add or update the following elements in the `DatabaseContext.tsx`  file:
- In the `DatabaseContextProvider` component, add `useState([])` instances to store the new collection
- Right below in the `useEffect`, use  `listenToCollection` to listen to a new collection
- Edit `DatabaseContextProps` to expose a new collection. You can also expose setters to ensure data validation or formatting before using `upload()` to update the data.


# Content

The `DatabaseContext.tsx` file contains the `DatabaseContextProvider` and `useDatabase` hooks to easily fetch data from the firebase realtime database. Use this hook in any component to have access to an exposed collection:

```js
const { myCollection, upload } = useDatabase()
```

To access the logged user informations, use the `useAuth` hook:

```js
const { user } = useAuth()
```

## The pages

To hide pages to unauthenticated users, one can use the wrapper component `<ProtectedPage />`:

```js
<ProtectedPage>
  {/* Protected page content here */}
</ProtectedPage>
```

## The menu

The menu is represented as the array `links` in the file `MainMenu.tsx`.
The pages can be hidden to unauthenticated users setting the prop `auth` to true.

To modify the menu, simply edit the array `links` and add items like this one:
```js
{ 
  icon: <ShieldCheck size={16} />, 
  to: "/secret", 
  color: 'gray', 
  label: 'Secret', 
  auth: true 
}
```

# Notes

## Import order

The import order is the following:
- `../styles/{globals.css}`
- `../{package.json}`
- `react`
- `next/{*}`
- `../../config/{*}`
- `firebase/{*}`
- `../../context/{*}`
- `@mantine/{core}`
- `tabler-icons-react`
- `../../utils/{*}`
- Custom components

## Create a child project

Follow these steps to build a custom project while fetching the updates from main repo `next-auth-mantine`:

- clone the project:  `git clone https://github.com/misurida/next-auth-mantine my-project`
- delete the git files
- publish your project
- Add a new remote repository named *upstream* that points to the main repo: `git remote add upstream https://github.com/misurida/next-auth-mantine`
- (Disable pushing to the main repo: `git config remote.upstream.pushurl "URL INVALID ON PURPOSE"`)

Last steps to setup the project:
- Update the `firebaseConfig.json` file
- Uncomment the .gitignore file line for firebase

You can now download the changes from the main repo using:

```
git pull upstream main --allow-unrelated-histories
```

Use `git fetch` to download the changes without auto merging:

```
git fetch upstream main
```


```
i18nexus pull -k as6rf4rFE5n56koSWobw5w
```