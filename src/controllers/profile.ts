import db from "../config/database";

// Creating profile
/* Sample data
{
  "full_name": "Givendarian Developer",
  "email": "givendarian@example.com",
  "phone": "+256700000000",
  "bio": "I am a software developer.",
  "location": "Kampala, Uganda",
  "age": 25
}

Rules to consider
1. Check if the request body has a JSON
2. Decide what fields are required (for example the full_name and email fields are required. The rest can be optional)
3. Validate the data:
    i. Check for empty strings
    ii. check if email has a proper format
    iii. Age must be a number and sensible range, 1 to 150. MUST NOT BE A NEGATIVE NUMBER OR INFINITY
4. Check if the profile already exists
5. Insert the profile (The important thing is that user input should never be concatenated directly into SQL)
6. Response returned :
{
    "success": true,
    "message": "Profile created successfully",
    "profile": {
        "id": 1,
    }
}

Errors to handle:
invalid input(Handle Null and Undefined values) - Bad request 
{
    "success": false,
    "message": "Invalid profile information",
    "errors": {
        "full_name": "Full name is required",
        "email": "Invalid email address"
    }
}
profile already exists - conflicts
database failure - internal server error
*/

export async function createProfile(req: Request) {
    let body;

    try {
        body = await req.json();
    } catch (error) {
        return Response.json({ error: "invalid or missing body", success: false }, { status: 400 });
    }
    let { full_name, email, phone, bio, location, age } = body;

    // 2. Check presence of required fields first
    // 1. Check for missing/null fields
    if (full_name === undefined || full_name === null || email === undefined || email === null) {
        return Response.json(
            { error: "Both full_name and email fields are required." },
            { status: 400 }
        );
    }

    // 3. Helper to trim and check for non-empty strings
    const processString = (val: unknown) => {
        if (typeof val === "string") {
            const trimmed = val.trim();
            if (trimmed === "") return null; // Flag empty strings
            return trimmed;
        }
        return val;
    };

    // Trim all provided string fields
    full_name = processString(full_name);
    email = processString(email);
    phone = processString(phone);
    bio = processString(bio);
    location = processString(location);

    // Reject if any provided string field resolved to an empty string (or non-string)
    const stringFields = { full_name, email, phone, bio, location };
    for (const [key, val] of Object.entries(stringFields)) {
        if (val === null) {
            return Response.json(
                { error: `Field '${key}' cannot be an empty string.` },
                { status: 400 }
            );
        }
    }

    // 3. Catch empty strings on provided fields
    const fields = { full_name, email, phone, bio, location };
    for (const [key, val] of Object.entries(fields)) {
        if (val === null) {
            return Response.json(
                { success: false, error: `Field '${key}' cannot be an empty string.` },
                { status: 400 }
            );
        }
    }

    // 4. Validate Email Format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email as string)) {
        return Response.json(
            { success: false, error: "Invalid email format." },
            { status: 400 }
        );
    }

    // 5. Validate Age (if provided)
    if (age != null) {
        const parsedAge = Number(age);
        if (
            !Number.isFinite(parsedAge) ||
            !Number.isInteger(parsedAge) ||
            parsedAge < 1 ||
            parsedAge > 150
        ) {
            return Response.json(
                { success: false, error: "Age must be a positive integer between 1 and 150." },
                { status: 400 }
            );
        }
        age = parsedAge;
    }

    // 6. Parameterized Database Insert
    try {
        const result = await db`
            INSERT INTO profiles (full_name, email, phone, bio, location, age)
            VALUES (${full_name}, ${email}, ${phone}, ${bio}, ${location}, ${age})
        `;

        console.log(result);

        return Response.json(
            {
                success: true,
                message: "Profile created successfully",
                data: {
                    full_name: full_name
                },
            },
            { status: 201 }
        );
    } catch (dbError: any) {
        console.error("Database Insert Error:", dbError.message);


        // Handle unique constraint violations (e.g., Duplicate email)
        if (dbError.errno === 1062) {
            return Response.json(
                { success: false, error: "A profile with this email already exists." },
                { status: 409 }
            );
        }

        return Response.json(
            { success: false, error: "Failed to create profile in database." },
            { status: 500 }
        );
    }

}

// Fetching the profile
// 1. Make a get request to /api/server
// controller recieves the request
// Queried the database
/* 
    SELECT
        id,
        full_name,
        email,
        phone,
        bio,
        location,
        age
    FROM profiles
*/
// check of the user exists
//      if (yes) -> Return the profile(s)
//      no -> 404
//      check for database failure
export async function getProfiles(req: Request) {
    try {
        const profiles = await db`
            SELECT
                id,
                full_name,
                email,
                phone,
                bio,
                location,
                age,
                created_at,
                updated_at
            FROM profiles
        `;

        // Check if any profiles exist
        if (!profiles || profiles.length === 0) {
            return Response.json(
                {
                    success: false,
                    message: "No profiles found",
                },
                { status: 404 }
            );
        }

        return Response.json(
            {
                success: true,
                message: "Profiles retrieved successfully",
                data: profiles,
            },
            { status: 200 }
        );
    } catch (dbError: any) {
        console.error("Database Fetch Error:", dbError.message);
        return Response.json(
            {
                success: false,
                error: "Failed to retrieve profiles from database.",
            },
            { status: 500 }
        );
    }
}

// Fetching Profile by ID
export async function getProfileById(req: Request) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id || isNaN(Number(id))) {
            return Response.json(
                {
                    success: false,
                    error: "A valid numeric profile ID is required",
                },
                { status: 400 }
            );
        }

        const [profile] = await db`
            SELECT
                id,
                full_name,
                email,
                phone,
                bio,
                location,
                age,
                created_at,
                updated_at
            FROM profiles
            WHERE id = ${Number(id)}
        `;

        // Check if profile exists
        if (!profile) {
            return Response.json(
                {
                    success: false,
                    error: `Profile with ID ${id} not found`,
                },
                { status: 404 }
            );
        }

        return Response.json(
            {
                success: true,
                message: "Profile retrieved successfully",
                data: profile,
            },
            { status: 200 }
        );
    } catch (dbError: any) {
        console.error("Database Fetch Error:", dbError.message);
        return Response.json(
            {
                success: false,
                error: "Failed to retrieve profile from database.",
            },
            { status: 500 }
        );
    }
}

// Deleting the profile by ID
// Get the id from the query ?id=
// Check if it exists in the database.
// Delete it from the database. 
// Return a response 

/**
 * DELETE /api/profile?id=X
 * Deletes a profile by ID
 */
export async function deleteProfile(req: Request) {
    try {
        const url = new URL(req.url);
        
        // Support both req.params.id and searchParams (?id=)
        const id = (req as any).params?.id || url.searchParams.get("id");

        // 1. Validate ID input
        if (!id || isNaN(Number(id))) {
            return Response.json(
                {
                    success: false,
                    error: "A valid numeric profile ID is required",
                },
                { status: 400 }
            );
        }

        const profileId = Number(id);

        // 2. Check if the profile exists before deleting
        const [existingProfile] = await db`
            SELECT id FROM profiles WHERE id = ${profileId}
        `;


        if (!existingProfile) {
            return Response.json(
                {
                    success: false,
                    error: `Profile with ID ${profileId} not found`,
                },
                { status: 404 }
            );
        }

        // 3. Delete from the database
        await db`
            DELETE FROM profiles WHERE id = ${profileId}
        `;

        // 4. Return success response
        return Response.json(
            {
                success: true,
                message: `Profile with ID ${profileId} deleted successfully`,
            },
            { status: 200 }
        );
    } catch (dbError: any) {
        console.error("Database Delete Error:", dbError.message);
        return Response.json(
            {
                success: false,
                error: "Failed to delete profile from database.",
            },
            { status: 500 }
        );
    }
}

// Updating the Profile
// The following fields are accepted (full_name, email, phone, age, bio and location)
// Missing fields are accepted. 
// The user sends a PUT request.
// Check the body for the accepted fields. It must be a json(if missing return 404). If fields are missing, its fine. But if someone includes a field not accepted, send a bad request
// Validate each field. 
//    full_name:
//        Must be a string.
//        Must not be empty.
//
//    email:
//        Must be a string.
//        Must not be empty.
//        Must have a valid email format.
//
//    phone:
//        Must be a string if provided.
//        Must not be an empty string.
//
//    age:
//        Must be a number.
//        Must be an integer.
//        Must be between 1 and 150.
//        Must not be negative, NaN, or Infinity.
//
//    bio:
//        Must be a string if provided.
//        Decide whether empty bio is allowed.
//
//    location:
//        Must be a string if provided.
//        Decide whether empty location is allowed.
// Get the id from the query parameter ?id=X
// Check if the profile exists with the id. Id must sanitized to remove all text and characters, then converted into a number. 
// Dynamically generate an update query with the fields provided.
// Return a response if update is successful or bad reques or internal server error.

/**
 * PUT /api/profile?id=X
 * Updates an existing user profile with dynamic fields
 */
export async function updateProfile(req: Request) {
    try {
        // 1. Sanitize & Validate ID parameter (?id=X)
        const url = new URL(req.url);
        const rawIdParam = (req as any).params?.id || url.searchParams.get("id");

        if (!rawIdParam) {
            return Response.json(
                { success: false, error: "A numeric profile ID is required in query parameters (?id=X)." },
                { status: 400 }
            );
        }

        // Sanitize: strip out all non-numeric characters
        const sanitizedIdStr = String(rawIdParam).replace(/\D/g, "");
        const profileId = Number(sanitizedIdStr);

        if (!sanitizedIdStr || isNaN(profileId) || profileId <= 0) {
            return Response.json(
                { success: false, error: "Invalid profile ID format provided." },
                { status: 400 }
            );
        }

        // 2. Parse & Validate JSON Body
        let body: Record<string, any>;
        try {
            body = await req.json();
        } catch {
            return Response.json(
                { success: false, error: "Invalid JSON body provided." },
                { status: 400 }
            );
        }

        // Check for empty body
        if (!body || Object.keys(body).length === 0) {
            return Response.json(
                { success: false, error: "Request body cannot be empty. At least one field to update must be provided." },
                { status: 400 }
            );
        }

        // 3. Check for unauthorized fields (strict whitelist)
        const allowedFields = ["full_name", "email", "phone", "age", "bio", "location"];
        const receivedFields = Object.keys(body);
        const invalidFields = receivedFields.filter((field) => !allowedFields.includes(field));

        if (invalidFields.length > 0) {
            return Response.json(
                {
                    success: false,
                    error: `Invalid field(s) provided: ${invalidFields.join(", ")}. Allowed fields are: ${allowedFields.join(", ")}.`,
                },
                { status: 400 }
            );
        }

        // 4. Validate Each Provided Field
        const { full_name, email, phone, age, bio, location } = body;

        // full_name
        if (full_name !== undefined) {
            if (typeof full_name !== "string") {
                return Response.json(
                    { success: false, error: "full_name must be a string." },
                    { status: 400 }
                );
            }
        }

        // email
        if (email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (typeof email !== "string" || !emailRegex.test(email.trim())) {
                return Response.json(
                    { success: false, error: "email must be a valid email address." },
                    { status: 400 }
                );
            }
        }

        // phone
        if (phone !== undefined) {
            if (typeof phone !== "string") {
                return Response.json(
                    { success: false, error: "phone must be a string if provided." },
                    { status: 400 }
                );
            }
        }

        // age
        if (age !== undefined) {
            if (
                typeof age !== "number" ||
                !Number.isInteger(age) ||
                isNaN(age) ||
                !Number.isFinite(age) ||
                age < 1 ||
                age > 150
            ) {
                return Response.json(
                    { success: false, error: "age must be an integer between 1 and 150." },
                    { status: 400 }
                );
            }
        }

        // bio (Empty string allowed to clear bio)
        if (bio !== undefined) {
            if (typeof bio !== "string") {
                return Response.json(
                    { success: false, error: "bio must be a string if provided." },
                    { status: 400 }
                );
            }
        }

        // location (Empty string allowed to clear location)
        if (location !== undefined) {
            if (typeof location !== "string") {
                return Response.json(
                    { success: false, error: "location must be a string if provided." },
                    { status: 400 }
                );
            }
        }

        // 5. Check if profile exists in database
        const [existingProfile] = await db`
            SELECT id FROM profiles WHERE id = ${profileId}
        `;

        if (!existingProfile) {
            return Response.json(
                { success: false, error: `Profile with ID ${profileId} not found.` },
                { status: 404 }
            );
        }

        // 6. Dynamically Build & Execute Update Query
        const updateData: Record<string, any> = {};
        if (full_name !== undefined) updateData.full_name = full_name.trim();
        if (email !== undefined) updateData.email = email.trim();
        if (phone !== undefined) updateData.phone = phone.trim();
        if (age !== undefined) updateData.age = age;
        if (bio !== undefined) updateData.bio = bio.trim();
        if (location !== undefined) updateData.location = location.trim();

        // Perform dynamic update using bun:sql
        await db`
            UPDATE profiles 
            SET ${db(updateData)}
            WHERE id = ${profileId}
        `;

        // 7. Retrieve & Return Updated Profile
        const [updatedProfile] = await db`
            SELECT id, full_name, email, phone, bio, location, age, created_at, updated_at
            FROM profiles
            WHERE id = ${profileId}
        `;

        return Response.json(
            {
                success: true,
                message: "Profile updated successfully.",
                data: updatedProfile,
            },
            { status: 200 }
        );
    } catch (dbError: any) {
        console.error("Database Update Error:", dbError.message);

        // Handle unique constraint violations (e.g. duplicate email on update)
        if (dbError.errno === 1062) {
            return Response.json(
                { success: false, error: "A profile with this email already exists." },
                { status: 409 }
            );
        }

        return Response.json(
            { success: false, error: "Failed to update profile due to database failure." },
            { status: 500 }
        );
    }
}