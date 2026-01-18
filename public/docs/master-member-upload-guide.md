# Master Member Upload Guide

## Overview

The Master Member Upload feature allows you to bulk import church members along with their group assignments (Districts, Ministries, Units) and leadership roles. The system automatically creates groups that don't exist and assigns leadership positions based on the data provided.

---

## CSV File Structure

Your CSV file must include a header row with the column names listed below. The order of columns doesn't matter as long as the headers match.

### Required Fields

| Column | Description | Example |
|--------|-------------|---------|
| First Name | Member's first name | John |
| Last Name | Member's last name | Adebayo |
| Email | Unique email address | john@email.com |
| Phone | Phone number with country code | +2348012345678 |
| Gender | Male or Female | Male |
| Date Of Birth | Date in YYYY-MM-DD format | 1985-03-15 |
| Campus | Must match an existing campus/branch name exactly | Main Campus |

### Optional Fields

| Column | Description | Example |
|--------|-------------|---------|
| Marital Status | Single, Married, Divorced, or Widowed | Married |
| Member Status | Member, DC, LXL, Director, Pastor | DC |
| Street | Street address | 12 Victoria Island |
| City | City name | Lagos |
| State | State/Province | Lagos |
| Country | Country name | Nigeria |
| Date Joined | Date in YYYY-MM-DD format | 2020-01-15 |
| Occupation | Job or profession | Software Engineer |
| Leadership Role | Senior Pastor, Associate Pastor, or Campus Pastor | Associate Pastor |
| District | District name (auto-created if not exists) | Lekki District |
| District Role | District Champ (assistant helper) | District Champ |
| Ministry | Ministry name (auto-created if not exists) | Media Ministry |
| Ministry Role | Ministry Director or Director | Ministry Director |
| Unit | Unit name (auto-created if not exists) | Sound Unit |
| Unit Role | Unit Head, Head, Assistant Head, or Assistant | Unit Head |

---

## Leadership Roles Explained

### Church-Wide Leadership (Leadership Role Column)

| Value | Description | Effect |
|-------|-------------|--------|
| **Senior Pastor** | Head of the church | Sets membership status to SENIOR_PASTOR |
| **Associate Pastor** | Assistant pastor | Sets membership status to PASTOR. **Automatically becomes District Head** if assigned to a district |
| **Campus Pastor** | Pastor of a specific campus | Sets membership status to PASTOR |

### District Leadership

- **Associate Pastors** who are assigned to a district automatically become the **District Head** of that district
- **District Champ** (District Role column) - These are assistant helpers in the district, NOT leaders

### Ministry Leadership (Ministry Role Column)

| Value | Description |
|-------|-------------|
| **Ministry Director** or **Director** | Head of the ministry |

### Unit Leadership (Unit Role Column)

| Value | Description |
|-------|-------------|
| **Unit Head** or **Head** | Leader of the unit |
| **Assistant Head** or **Assistant** | Second-in-command of the unit |

---

## Member Status Values

| Value | Description |
|-------|-------------|
| Member | Regular church member (default) |
| DC | David's Company / Worker |
| LXL | Leader |
| Director | Director level |
| Pastor | Pastor level |

---

## Auto-Creation of Groups

The system automatically creates groups that don't exist in this order:

1. **Ministries** are created first
2. **Districts** are created second
3. **Units** are created last and linked to their parent ministry

### Important Rules

- **Units MUST have a Ministry** - If you specify a Unit, you must also specify a Ministry
- **Groups are matched case-insensitively** - "Media Ministry" and "media ministry" are treated as the same
- **Groups are branch-specific** - Each campus/branch has its own set of groups

---

## Duplicate Detection

A member is considered a duplicate if ALL THREE of these match:
- First Name (case-insensitive)
- Last Name (case-insensitive)
- Email (case-insensitive)

Duplicate records will be rejected with an error message.

---

## Validation Rules

1. **Campus must exist** - The campus/branch name must match an existing campus in the system
2. **Unit requires Ministry** - Cannot specify a Unit without a Ministry
3. **District Role requires District** - Cannot specify District Champ without a District
4. **Ministry Role requires Ministry** - Cannot specify Ministry Director without a Ministry
5. **Unit Role requires Unit** - Cannot specify Unit Head/Assistant without a Unit
6. **Valid date formats** - Dates must be in YYYY-MM-DD format (e.g., 1985-03-15)
7. **Valid gender values** - Must be Male, Female, M, or F

---

## Sample CSV

```csv
First Name,Last Name,Email,Phone,Gender,Date Of Birth,Marital Status,Member Status,Street,City,State,Country,Date Joined,Campus,Leadership Role,District,District Role,Ministry,Ministry Role,Unit,Unit Role,Occupation
John,Adebayo,john.adebayo@email.com,+2348012345678,Male,1985-03-15,Married,LXL,12 Victoria Island,Lagos,Lagos,Nigeria,2020-01-15,Main Campus,Senior Pastor,,,,,,CEO
Sarah,Okonkwo,sarah.okonkwo@email.com,+2348023456789,Female,1990-07-22,Single,DC,45 Ikeja GRA,Lagos,Lagos,Nigeria,2019-06-20,Main Campus,Associate Pastor,Lekki District,,Choir Ministry,Ministry Director,Soprano Unit,Unit Head,Accountant
Michael,Eze,michael.eze@email.com,+2348034567890,Male,1988-11-08,Married,DC,78 Surulere,Lagos,Lagos,Nigeria,2021-03-10,Main Campus,Campus Pastor,Ikeja District,,Media Ministry,,,Teacher
Grace,Nnamdi,grace.nnamdi@email.com,+2348045678901,Female,1995-02-28,Single,DC,23 Yaba,Lagos,Lagos,Nigeria,2022-08-05,Main Campus,,Ikeja District,District Champ,Ushering Ministry,Ministry Director,Protocol Unit,Unit Head,Nurse
David,Okafor,david.okafor@email.com,+2348056789012,Male,1992-09-14,Single,Member,56 Ajah,Lagos,Lagos,Nigeria,2023-01-20,Main Campus,,Ikeja District,District Champ,Ushering Ministry,,Protocol Unit,Assistant Head,Designer
Emmanuel,Bassey,emmanuel.bassey@email.com,+2348067890123,Male,1987-05-30,Married,Member,89 Ikoyi,Lagos,Lagos,Nigeria,2018-11-15,Main Campus,,Lekki District,,Media Ministry,,Sound Unit,Unit Head,Engineer
Blessing,Uche,blessing.uche@email.com,+2348078901234,Female,1993-12-03,Single,Member,34 Festac,Lagos,Lagos,Nigeria,2022-04-18,Festac Campus,Associate Pastor,Festac District,,Children Ministry,Ministry Director,Teachers Unit,Unit Head,Social Worker
Daniel,Amadi,daniel.amadi@email.com,+2348089012345,Male,1991-08-19,Married,DC,67 Apapa,Lagos,Lagos,Nigeria,2020-09-25,Festac Campus,,Festac District,District Champ,Children Ministry,,Helpers Unit,Unit Head,Banker
Chioma,Okoro,chioma.okoro@email.com,+2348090123456,Female,1996-04-11,Single,Member,12 Maryland,Lagos,Lagos,Nigeria,2023-06-01,Main Campus,,Lekki District,,Choir Ministry,,Soprano Unit,,Marketing Executive
Peter,Uwah,peter.uwah@email.com,+2348001234567,Male,1984-01-25,Married,LXL,90 Allen Avenue,Lagos,Lagos,Nigeria,2017-02-14,Main Campus,,Ikeja District,,Ushering Ministry,,Parking Unit,Unit Head,Architect
```

---

## Understanding the Sample Data

| Member | Leadership Role | District Role | What Happens |
|--------|-----------------|---------------|--------------|
| John Adebayo | Senior Pastor | - | Church senior pastor, no district assignment |
| Sarah Okonkwo | Associate Pastor | - | **District Head of Lekki District** (automatic), Ministry Director of Choir Ministry, Unit Head of Soprano Unit |
| Michael Eze | Campus Pastor | - | Campus pastor, assigned to Ikeja District as a member |
| Grace Nnamdi | - | District Champ | Helper in Ikeja District, Ministry Director of Ushering Ministry, Unit Head of Protocol Unit |
| David Okafor | - | District Champ | Helper in Ikeja District, Assistant Unit Head of Protocol Unit |
| Emmanuel Bassey | - | - | Regular member in Lekki District, Unit Head of Sound Unit |
| Blessing Uche | Associate Pastor | - | **District Head of Festac District** (automatic), Ministry Director of Children Ministry |
| Daniel Amadi | - | District Champ | Helper in Festac District, Unit Head of Helpers Unit |
| Chioma Okoro | - | - | Regular member in Lekki District, member of Soprano Unit |
| Peter Uwah | - | - | Regular member in Ikeja District, Unit Head of Parking Unit |

---

## Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Campus/Branch not found" | Campus name doesn't match any existing campus | Check spelling and ensure the campus exists in the system |
| "Ministry is required when Unit is specified" | Unit specified without a Ministry | Add a Ministry for the member or remove the Unit |
| "Member already exists" | Duplicate first name + last name + email | Check if member already exists or use a different email |
| "Invalid date format" | Date not in YYYY-MM-DD format | Use format like 1985-03-15 |
| "Gender is required" | Gender field empty or invalid | Use Male, Female, M, or F |

---

## Step-by-Step Upload Process

1. **Prepare your CSV file** following the structure above
2. **Navigate to Entry Import** in the admin dashboard
3. **Select "Master Member Sheet"** as the import type
4. **Upload your CSV file**
5. **Review the preview** to check for any validation errors
6. **Submit the import** to begin processing
7. **Monitor progress** - the system will show success/failure for each row
8. **Review failed records** and fix any issues in your CSV
9. **Re-upload corrected records** if needed

---

## Tips for Success

1. **Start with a small batch** - Test with 5-10 members first to ensure your format is correct
2. **Ensure campus exists** - Create all campuses in the system before uploading
3. **Use consistent naming** - "Media Ministry" and "Media ministry" are the same, but "Media" and "Media Ministry" are different
4. **Check date formats** - Use YYYY-MM-DD format (e.g., 1985-03-15, not 15/03/1985)
5. **Include country code** - Phone numbers should include country code (e.g., +234)
6. **Leave empty cells for N/A** - Don't fill in "N/A" or "-", just leave the cell empty
7. **Save as CSV** - Ensure your spreadsheet is saved as CSV (Comma Separated Values)

---

## Need Help?

If you encounter issues not covered in this guide, please contact your system administrator with:
- The error message you received
- The row number(s) that failed
- A sample of the problematic data (with sensitive info removed)
