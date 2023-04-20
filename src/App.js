import React, { useEffect, useState } from 'react';
import { Amplify, Auth, Hub } from 'aws-amplify';
import awsConfig from './aws-exports';

Amplify.configure(awsConfig);

function App() {
  const [user, setUser] = useState(null);
  console.log(user);
  useEffect(() => {
    Hub.listen('auth', ({ payload: { event, data } }) => {
      // eslint-disable-next-line default-case
      switch (event) {
        case 'signIn':
        case 'cognitoHostedUI':
          fetchUser();
          break;
        case 'signOut':
          setUser(null);
          break;
        case 'signIn_failure':
        case 'cognitoHostedUI_failure':
          console.log('Sign in failure', data);
          break;
      }
    });

    fetchUser();
  }, []);

  const fetchUser = async () => {
    const currentUser = await getUser();
    setUser(currentUser);
  };

  async function getUser() {
    try {
      const userData = await Auth.currentAuthenticatedUser();
      return userData;
    } catch {
      return console.log('Not signed in');
    }
  }

  return (
    <div>
      <p>User: {user ? JSON.stringify(user.attributes) : 'None'}</p>
      {user ? (
        <button onClick={() => Auth.signOut()}>Sign Out</button>
      ) : (
        <button onClick={() => Auth.federatedSignIn()}>
          Federated Sign In
        </button>
      )}
    </div>
  );
}

export default App;
