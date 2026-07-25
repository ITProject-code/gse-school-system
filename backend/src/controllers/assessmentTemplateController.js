const pool = require("../config/db");

// ==================== CREATE TEMPLATE ====================
const createTemplate = async (req, res) => {
    try {
        const { teacher_id, subject_id, assessment_name, semester, academic_year, default_points } = req.body;

        if (!teacher_id || !assessment_name) {
            return res.status(400).json({
                message: "Teacher ID and assessment name are required",
            });
        }

        const result = await pool.query(
            `
            INSERT INTO assessment_templates (
                teacher_id, subject_id, assessment_name, semester, academic_year, default_points
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [teacher_id, subject_id || null, assessment_name, semester || 'Semester 1', academic_year || '2026/27', default_points || 10]
        );

        res.status(201).json({
            message: "Template created successfully",
            template: result.rows[0],
        });
    } catch (error) {
        console.error("Error creating template:", error);
        res.status(500).json({
            message: "Failed to create template",
            error: error.message,
        });
    }
};

// ==================== GET TEMPLATES ====================
const getTemplates = async (req, res) => {
    try {
        const { subject_id } = req.params;
        const { semester, academic_year } = req.query;

        let query = `
            SELECT * FROM assessment_templates 
            WHERE subject_id = $1
        `;
        let params = [subject_id];

        if (semester) {
            query += ` AND semester = $2`;
            params.push(semester);
        }

        if (academic_year) {
            query += ` AND academic_year = $3`;
            params.push(academic_year);
        }

        query += ` ORDER BY assessment_name`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching templates:", error);
        res.status(500).json({
            message: "Failed to fetch templates",
            error: error.message,
        });
    }
};

// ==================== UPDATE TEMPLATE ====================
const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { assessment_name, default_points, semester, academic_year } = req.body;

        const result = await pool.query(
            `
            UPDATE assessment_templates 
            SET 
                assessment_name = COALESCE($1, assessment_name),
                default_points = COALESCE($2, default_points),
                semester = COALESCE($3, semester),
                academic_year = COALESCE($4, academic_year),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *
            `,
            [assessment_name, default_points, semester, academic_year, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Template not found",
            });
        }

        res.json({
            message: "Template updated successfully",
            template: result.rows[0],
        });
    } catch (error) {
        console.error("Error updating template:", error);
        res.status(500).json({
            message: "Failed to update template",
            error: error.message,
        });
    }
};

// ==================== DELETE TEMPLATE ====================
const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM assessment_templates WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Template not found",
            });
        }

        res.json({
            message: "Template deleted successfully",
            template: result.rows[0],
        });
    } catch (error) {
        console.error("Error deleting template:", error);
        res.status(500).json({
            message: "Failed to delete template",
            error: error.message,
        });
    }
};

module.exports = {
    createTemplate,
    getTemplates,
    updateTemplate,
    deleteTemplate,
};