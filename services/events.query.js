export const EVENTS_BY_RANGE_QUERY = `
query EventsByRange(
  $first: Int!
  $after: String
  $filters: [DBFilterInput!]
) {
  Events(first: $first, after: $after, filter: $filters) {
    edges {
      node {
        name
        subject
        description
        starts_on
        ends_on
        color
        event_category
        owner {
          name
          full_name
          email
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;
