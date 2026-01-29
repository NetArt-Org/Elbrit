"use client";

const GRAPHQL_ENDPOINT = "https://uat.elbrit.org/api/method/graphql";

export async function uploadLeaveMedicalCertificate(values, leaveName) {
  if (!values?.medicalAttachment || !leaveName) return;

  const formData = new FormData();

  const query = `
    mutation UploadFile(
      $file: Upload!
      $attached_to_doctype: String
      $attached_to_name: String
      $fieldname: String
      $is_private: Boolean
    ) {
      uploadFile(
        file: $file
        attached_to_doctype: $attached_to_doctype
        attached_to_name: $attached_to_name
        fieldname: $fieldname
        is_private: $is_private
      ) {
        name
        file_url
      }
    }
  `;

  formData.append(
    "operations",
    JSON.stringify({
      query,
      variables: {
        file: null,
        attached_to_doctype: "Leave Application",
        attached_to_name: leaveName,
        fieldname: "fsl_attach",
        is_private: true,
      },
    })
  );

  formData.append(
    "map",
    JSON.stringify({
      "0": ["variables.file"],
    })
  );

  formData.append("0", values.medicalAttachment);

  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `token ${process.env.NEXT_PUBLIC_FRAPPE_TOKEN}`,
    },
    body: formData,
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  return json.data?.uploadFile;
}
