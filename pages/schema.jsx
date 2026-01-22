import { gql, useQuery } from '@apollo/client'

const ROOT_QUERY = gql`
  query {
    __schema {
      queryType {
        fields {
          name
        }
      }
    }
  }
`

export default function Home() {
  const { data, loading, error } = useQuery(ROOT_QUERY)

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>
  if (!data) return null

  return (
    <div style={{ padding: 20 }}>
      <h1>Available Queries</h1>
      <ul>
        {data.__schema.queryType.fields.map(field => (
          <li key={field.name}>{field.name}</li>
        ))}
      </ul>
    </div>
  )
}
