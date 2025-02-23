# Query Harbor

A collection of custom React hooks built on top of TanStack Query (formerly React Query) for handling API requests, mutations, and cookie management. These hooks provide a standardized way to handle data fetching, caching, and state management in React applications.

## Table of Contents

- [Installation](#installation)
- [Hooks Overview](#hooks-overview)
  - [useGlobalQuery](#useglobalquery)
  - [useGlobalMutation](#useglobalmutation)
  - [useGlobalInfiniteQuery](#useglobalinfinitequery)
  - [useCookie](#usecookie)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)

## Installation

```bash
# Install required dependencies
npm install @tanstack/react-query react-cookie axios
```

## Hooks Overview

### useGlobalQuery

A custom hook for making standard API requests with built-in caching and state management.

#### Features
- Automatic authentication header handling
- Configurable cache and stale times 
- Built-in error handling
- Query invalidation support

#### Basic Usage

```javascript
const {
    queryData,
    isLoading,
    isError,
    error,
    refetchQuery
} = useGlobalQuery({
    url: '/api/users',
    queryKey: ['users'],
    methodType: 'GET'
});
```

### useGlobalMutation

A custom hook for handling data mutations (create, update, delete operations) with support for FormData.

#### Features
- FormData support with nested object handling
- Automatic query invalidation after successful mutation
- Priority data support
- Built-in error handling

#### Basic Usage

```javascript
const {
    runMutation,
    mutationLoading,
    mutationData,
    mutationError,
    isMutationSucceeded
} = useGlobalMutation({
    url: '/api/users',
    queriesToInvalidate: ['users'],
    methodType: 'POST',
    data: userData
});
```

#### FormData Upload Examples

##### Basic FormData Upload

```javascript
const {
    runMutation,
    mutationLoading
} = useGlobalMutation({
    url: '/api/upload',
    queriesToInvalidate: ['files'],
    methodType: 'POST',
    isFormData: true,
    data: {
        file: fileObject,
        title: 'My Document'
    }
});
```

##### Complex FormData with Arrays

```javascript
// Without excludedIndexKeys
const data = {
    files: [file1, file2],
    metadata: {
        titles: ['Doc 1', 'Doc 2']
    }
};

// This will generate FormData with structure:
// files[0] = file1
// files[1] = file2
// metadata[titles][0] = Doc 1
// metadata[titles][1] = Doc 2
```

##### Using excludedIndexKeys

```javascript
const MultipleFileUpload = () => {
    const {
        runMutation,
        mutationLoading
    } = useGlobalMutation({
        url: '/api/upload-multiple',
        queriesToInvalidate: ['files'],
        methodType: 'POST',
        isFormData: true,
        // Specify which keys should not include array indices
        excludedIndexKeys: ['files', 'documents'],
        data: {
            files: [file1, file2, file3],
            documents: [docFile1, docFile2],
            metadata: {
                titles: ['Doc 1', 'Doc 2', 'Doc 3'],
                categories: ['Cat 1', 'Cat 2', 'Cat 3']
            }
        }
    });

    return (
        <button onClick={() => runMutation()}>
            Upload Files
        </button>
    );
};
```

The above example will generate FormData with the following structure:
```plaintext
// Keys with excludedIndexKeys:
files = file1
files = file2
files = file3
documents = docFile1
documents = docFile2

// Regular array keys (maintain indices):
metadata[titles][0] = Doc 1
metadata[titles][1] = Doc 2
metadata[titles][2] = Doc 3
metadata[categories][0] = Cat 1
metadata[categories][1] = Cat 2
metadata[categories][2] = Cat 3
```

##### Real-World Example: Multiple File Upload with Metadata

```javascript
const DocumentUploadForm = () => {
    const [files, setFiles] = useState([]);
    const [metadata, setMetadata] = useState({
        department: 'HR',
        tags: ['confidential', 'employee'],
    });

    const {
        runMutation,
        mutationLoading,
        isMutationSucceeded
    } = useGlobalMutation({
        url: '/api/documents/upload',
        queriesToInvalidate: ['documents'],
        methodType: 'POST',
        isFormData: true,
        excludedIndexKeys: ['files'], // files will be sent without indices
        data: {
            files: files,
            metadata: metadata,
            timestamp: new Date().toISOString(),
            user: {
                id: currentUserId,
                role: userRole
            }
        }
    });

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
    };

    const handleUpload = () => {
        runMutation();
    };

    return (
        <div>
            <input 
                type="file" 
                multiple 
                onChange={handleFileChange} 
            />
            {mutationLoading ? (
                <p>Uploading...</p>
            ) : (
                <button onClick={handleUpload}>
                    Upload Documents
                </button>
            )}
            {isMutationSucceeded && (
                <p>Upload completed successfully!</p>
            )}
        </div>
    );
};
```

This will generate FormData where:
- Multiple files are sent with the same key name ('files')
- Metadata is properly nested with array indices preserved
- Additional data is structured appropriately

The resulting FormData structure will be:
```plaintext
files = File1
files = File2
metadata[department] = HR
metadata[tags][0] = confidential
metadata[tags][1] = employee
timestamp = 2024-02-23T10:00:00.000Z
user[id] = 123
user[role] = admin
```

#### When to Use excludedIndexKeys

Use `excludedIndexKeys` when:
1. Working with file upload APIs that expect multiple files with the same key
2. Dealing with legacy APIs that don't support indexed form fields
3. Implementing multi-file upload where the server expects a flat structure
4. Handling file arrays where order doesn't matter

### useGlobalInfiniteQuery

A custom hook for handling infinite scroll or pagination scenarios.

#### Features
- Automatic pagination handling
- Built-in cache management
- Total count tracking
- Next page detection

#### Basic Usage

```javascript
const {
    queryData,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    totalCount
} = useGlobalInfiniteQuery({
    url: '/api/posts',
    queryKey: ['posts'],
    methodType: 'GET',
    data: { limit: 10 }
});
```

### useCookie

A utility hook for managing cookies across the application.

#### Features
- Simple cookie management
- Type-safe cookie operations
- Easy integration with authentication

#### Basic Usage

```javascript
const { cookie, setCookie, removeCookie } = useCookie({
    cookieName: 'accessToken'
});
```

## API Reference

### useGlobalQuery Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | string | required | API endpoint URL |
| queryKey | string[] | required | Unique key for caching |
| methodType | string | required | HTTP method (GET, POST, etc.) |
| data | object | optional | Request payload |
| enabled | boolean | true | Whether to enable the query |
| cacheTime | number | 300000 | Cache duration in ms |
| staleTime | number | 300000 | Stale data duration in ms |

### useGlobalMutation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | string | required | API endpoint URL |
| queriesToInvalidate | string[] | required | Queries to refresh after mutation |
| methodType | string | required | HTTP method (POST, PUT, DELETE) |
| data | object | optional | Default mutation data |
| isFormData | boolean | false | Whether to handle as FormData |
| closePopup | function | optional | Callback after success |
| excludedIndexKeys | string[] | optional | Keys to exclude from FormData indices |

### useGlobalInfiniteQuery Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | string | required | API endpoint URL |
| queryKey | string[] | required | Unique key for caching |
| methodType | string | required | HTTP method |
| data | object | optional | Additional query parameters |
| enabled | boolean | true | Whether to enable the query |
| cacheTime | number | 300000 | Cache duration in ms |
| staleTime | number | 300000 | Stale data duration in ms |

## Best Practices

1. Always provide unique and descriptive query keys
2. Set appropriate cache and stale times based on data volatility
3. Handle loading and error states in your UI
4. Use the refetchQuery function for manual data refresh
5. Implement proper error boundaries in your application

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT