import React, { useEffect, useState } from 'react';
import { API, Auth, Hub, graphqlOperation, Amplify } from 'aws-amplify';

import { createTodo } from './graphql/mutations';
import { listTodos } from './graphql/queries';

const initialState = { name: '', description: '' };

function App() {
  const [user, setUser] = useState(null);
  const [formState, setFormState] = useState(initialState);
  const [todos, setTodos] = useState([]);

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
    fetchTodos();
  }, []);

  const fetchUser = async () => {
    const currentUser = await getUser();
    setUser(currentUser);
  };

  const getUser = async () => {
    try {
      const userData = await Auth.currentAuthenticatedUser();
      return userData;
    } catch {
      return console.log('Not signed in');
    }
  };

  const setInput = async (key, value) => {
    setFormState({ ...formState, [key]: value });
  };

  const fetchTodos = async () => {
    try {
      const todoData = await API.graphql(graphqlOperation(listTodos));
      const todos = todoData.data.listTodos.items;
      setTodos(todos);
    } catch (err) {
      console.log('error fetching todos');
    }
  };

  async function addTodo() {
    try {
      if (!formState.name || !formState.description) return;
      const todo = { ...formState };
      setTodos([...todos, todo]);
      setFormState(initialState);
      await API.graphql(graphqlOperation(createTodo, { input: todo }));
    } catch (err) {
      console.log('error creating todo:', err);
    }
  }

  return (
    <div>
      <div style={styles.userContainer}>
        <pre style={styles.userText}>
          User: {user ? JSON.stringify(user.attributes, null, 2) : 'None'}
        </pre>
        {user ? (
          <button style={styles.signOutButton} onClick={() => Auth.signOut()}>
            Sign Out
          </button>
        ) : (
          <button
            style={styles.signInButton}
            onClick={() => Auth.federatedSignIn()}
          >
            Federated Sign In
          </button>
        )}
      </div>
      <div style={styles.container}>
        <h2>Amplify Todos</h2>
        <input
          onChange={(event) => setInput('name', event.target.value)}
          style={styles.input}
          value={formState.name}
          placeholder="Name"
        />
        <input
          onChange={(event) => setInput('description', event.target.value)}
          style={styles.input}
          value={formState.description}
          placeholder="Description"
        />
        <button style={styles.button} onClick={addTodo}>
          Create Todo
        </button>
        {todos.map((todo, index) => (
          <div key={todo.id ? todo.id : index} style={styles.todo}>
            <p style={styles.todoName}>{todo.name}</p>
            <p style={styles.todoDescription}>{todo.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '20px',
    borderRadius: '10px',
    backgroundColor: '#f2f2f2',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px',
  },
  todo: {
    marginBottom: '15px',
  },
  input: {
    border: 'none',
    backgroundColor: '#f8f8f8',
    marginBottom: '10px',
    padding: '8px',
    fontSize: '18px',
    borderRadius: '5px',
  },
  todoName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
  },
  todoDescription: {
    marginBottom: '0',
  },
  button: {
    backgroundColor: '#ff7f50',
    color: 'white',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '18px',
    marginTop: '10px',
  },
  userContainer: {
    width: 'fit-content',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '10px 20px',
    backgroundColor: '#ffffff',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    marginBlock: '20px',
    wordWrap: 'break-word',
    maxWidth: '800px',
    boxSizing: 'border-box',
    whiteSpace: 'normal',
  },
  userName: {
    margin: 0,
    marginRight: 10,
    color: '#777',
  },
  signOutButton: {
    backgroundColor: '#ff7f50',
    color: '#ffffff',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginLeft: 10,
  },
  signInButton: {
    backgroundColor: '#007bff',
    color: '#ffffff',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginLeft: 10,
  },
  userText: {
    fontFamily: 'monospace',
    fontSize: '14px',
    whiteSpace: 'pre-wrap',
    margin: 0,
    padding: 0,
    overflowX: 'auto',
  },
};


export default App;
