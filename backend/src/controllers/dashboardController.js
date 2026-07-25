const pool = require("../config/db");

// GET COMPLETE DASHBOARD STATISTICS
const getDashboardStats = async (req, res) => {
    try {
        // 1. Get total counts
        const studentsResult = await pool.query(
            "SELECT COUNT(*) as count FROM students WHERE status = 'ACTIVE'"
        );
        const teachersResult = await pool.query(
            "SELECT COUNT(*) as count FROM teachers WHERE status = 'ACTIVE'"
        );
        const usersResult = await pool.query(
            "SELECT COUNT(*) as count FROM users WHERE is_active = true"
        );

        // 2. Get pending admissions
        const pendingAdmissionsResult = await pool.query(
            "SELECT COUNT(*) as count FROM admissions WHERE status = 'PENDING'"
        );

        // 3. 👇 NEW: Get pending teacher admissions
        const pendingTeacherAdmissionsResult = await pool.query(
            "SELECT COUNT(*) as count FROM teachers WHERE status = 'PENDING'"
        );

        // 4. Get today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayAttendanceResult = await pool.query(
            `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late
            FROM attendance 
            WHERE attendance_date = $1
            `,
            [today]
        );

        // 5. Get total subjects
        const subjectsResult = await pool.query(
            "SELECT COUNT(*) as count FROM subjects"
        );

        // 6. Get total assessments
        const assessmentsResult = await pool.query(
            "SELECT COUNT(*) as count FROM assessments"
        );

        // 7. Get total report cards
        const reportCardsResult = await pool.query(
            "SELECT COUNT(*) as count FROM report_cards"
        );

        // 8. Get published report cards
        const publishedReportCardsResult = await pool.query(
            "SELECT COUNT(*) as count FROM report_cards WHERE status = 'published'"
        );

        // 9. Get recent students (last 5)
        const recentStudentsResult = await pool.query(
            `
            SELECT id, student_id, first_name, last_name, grade_level, section, created_at
            FROM students 
            WHERE status = 'ACTIVE'
            ORDER BY created_at DESC 
            LIMIT 5
            `
        );

        // 10. Get recent admissions (last 5)
        const recentAdmissionsResult = await pool.query(
            `
            SELECT id, application_no, first_name, last_name, status, created_at
            FROM admissions 
            ORDER BY created_at DESC 
            LIMIT 5
            `
        );

        // 11. 👇 NEW: Get recent teacher admissions (last 5)
        const recentTeacherAdmissionsResult = await pool.query(
            `
            SELECT 
                id, 
                employee_id, 
                first_name, 
                last_name, 
                qualification, 
                status, 
                created_at
            FROM teachers 
            WHERE status = 'PENDING'
            ORDER BY created_at DESC 
            LIMIT 5
            `
        );

        // 12. Get grade distribution (students per grade)
        const gradeDistributionResult = await pool.query(
            `
            SELECT grade_level, COUNT(*) as count
            FROM students
            WHERE grade_level IS NOT NULL AND status = 'ACTIVE'
            GROUP BY grade_level
            ORDER BY grade_level
            `
        );

        // 13. Get weekly attendance trend (last 7 days)
        const weeklyAttendanceResult = await pool.query(
            `
            SELECT 
                attendance_date,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
            FROM attendance 
            WHERE attendance_date >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY attendance_date
            ORDER BY attendance_date DESC
            `
        );

        // 14. Get fee summary (using payments table)
        let feeSummary = { total_fees: 0, total_paid: 0, balance: 0 };
        try {
            const feeResult = await pool.query(`
                SELECT 
                    COALESCE(SUM(amount), 0) as total_fees,
                    COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as total_paid
                FROM payments
            `);
            feeSummary = {
                total_fees: parseFloat(feeResult.rows[0]?.total_fees || 0),
                total_paid: parseFloat(feeResult.rows[0]?.total_paid || 0),
                balance: parseFloat(feeResult.rows[0]?.total_fees || 0) - parseFloat(feeResult.rows[0]?.total_paid || 0),
            };
        } catch (e) {
            console.log("Payments table might not exist yet, skipping fee summary...");
        }

        // 15. Get upcoming deadlines (if any)
        let upcomingDeadlines = [];
        try {
            const deadlinesResult = await pool.query(`
                SELECT 
                    s.id as student_id,
                    s.first_name,
                    s.last_name,
                    p.month,
                    p.year,
                    p.amount,
                    p.status
                FROM payments p
                JOIN students s ON p.student_id = s.id
                WHERE p.status = 'UNPAID'
                ORDER BY p.year, p.month
                LIMIT 5
            `);
            upcomingDeadlines = deadlinesResult.rows;
        } catch (e) {
            console.log("Payments table might not exist yet, skipping deadlines...");
        }

        // 16. Get recent activity (combine students, admissions, assessments)
        const recentActivityResult = await pool.query(
            `
            (SELECT 
                'student' as type,
                id,
                first_name || ' ' || last_name as name,
                created_at as date,
                'added a new student' as action
            FROM students
            WHERE status = 'ACTIVE'
            ORDER BY created_at DESC
            LIMIT 3)
            UNION ALL
            (SELECT 
                'admission' as type,
                id,
                first_name || ' ' || last_name as name,
                created_at as date,
                'submitted an application' as action
            FROM admissions
            ORDER BY created_at DESC
            LIMIT 3)
            UNION ALL
            (SELECT 
                'assessment' as type,
                id,
                'Assessment' as name,
                created_at as date,
                'added new assessment' as action
            FROM assessments
            ORDER BY created_at DESC
            LIMIT 3)
            ORDER BY date DESC
            LIMIT 10
            `
        );

        res.json({
            // Stats Cards
            stats: {
                students: parseInt(studentsResult.rows[0].count) || 0,
                teachers: parseInt(teachersResult.rows[0].count) || 0,
                users: parseInt(usersResult.rows[0].count) || 0,
                pendingAdmissions: parseInt(pendingAdmissionsResult.rows[0].count) || 0,
                pendingTeacherAdmissions: parseInt(pendingTeacherAdmissionsResult.rows[0].count) || 0, // 👈 NEW
                subjects: parseInt(subjectsResult.rows[0].count) || 0,
                assessments: parseInt(assessmentsResult.rows[0].count) || 0,
                reportCards: parseInt(reportCardsResult.rows[0].count) || 0,
                publishedReportCards: parseInt(publishedReportCardsResult.rows[0].count) || 0,
                feeSummary: feeSummary,
            },
            
            // Today's Attendance
            todayAttendance: {
                total: parseInt(todayAttendanceResult.rows[0]?.total || 0),
                present: parseInt(todayAttendanceResult.rows[0]?.present || 0),
                absent: parseInt(todayAttendanceResult.rows[0]?.absent || 0),
                late: parseInt(todayAttendanceResult.rows[0]?.late || 0),
                percentage: todayAttendanceResult.rows[0]?.total > 0 
                    ? ((todayAttendanceResult.rows[0].present / todayAttendanceResult.rows[0].total) * 100).toFixed(1)
                    : 0,
            },
            
            // Recent Data
            recentStudents: recentStudentsResult.rows,
            recentAdmissions: recentAdmissionsResult.rows,
            recentTeacherAdmissions: recentTeacherAdmissionsResult.rows, // 👈 NEW
            gradeDistribution: gradeDistributionResult.rows,
            weeklyAttendance: weeklyAttendanceResult.rows,
            upcomingDeadlines: upcomingDeadlines,
            recentActivity: recentActivityResult.rows,
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({
            message: "Failed to fetch dashboard statistics",
            error: error.message,
        });
    }
};

module.exports = {
    getDashboardStats,
};