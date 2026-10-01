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
                    full_name : full_name
                },
            },
            { status: 201 }
        );
    } catch (dbError: any) {
        console.error("Database Insert Error:", dbError.message);
        

        // Handle unique constraint violations (e.g., Duplicate email)
        if (dbError.code === "ERR_MYSQL_SERVER_ERROR") {
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
