import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api/api';
import { colors } from '../utils/colors';
import { useAuth } from '../context/AuthContext';

const DashboardScreen = () => {
    const navigation = useNavigation();
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboard, setDashboard] = useState(null);

    const fetchDashboard = async () => {
        try {
            const response = await api.get('/student/dashboard');
            setDashboard(response.data);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            if (error.response?.status === 401) {
                logout();
                navigation.replace('Login');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboard();
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', onPress: () => { logout(); navigation.replace('Login'); } }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    if (!dashboard) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Failed to load dashboard</Text>
                <TouchableOpacity onPress={fetchDashboard} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { student, summary, attendance, enrolledSubjects } = dashboard;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.name}>{student.first_name} {student.last_name}</Text>
                    <Text style={styles.grade}>Grade {student.grade_level}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{summary.total_subjects}</Text>
                    <Text style={styles.statLabel}>Subjects</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{summary.average || 0}%</Text>
                    <Text style={styles.statLabel}>Average</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{summary.overall_grade || 'F'}</Text>
                    <Text style={styles.statLabel}>Overall Grade</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{attendance.percentage || 0}%</Text>
                    <Text style={styles.statLabel}>Attendance</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('Grades')}
                >
                    <Text style={styles.actionIcon}>📊</Text>
                    <Text style={styles.actionLabel}>Grades</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('Attendance')}
                >
                    <Text style={styles.actionIcon}>📅</Text>
                    <Text style={styles.actionLabel}>Attendance</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('Subjects')}
                >
                    <Text style={styles.actionIcon}>📚</Text>
                    <Text style={styles.actionLabel}>Subjects</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('ReportCard')}
                >
                    <Text style={styles.actionIcon}>📄</Text>
                    <Text style={styles.actionLabel}>Report Card</Text>
                </TouchableOpacity>
            </View>

            {/* Recent Subjects */}
            {enrolledSubjects && enrolledSubjects.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>My Subjects</Text>
                    <View style={styles.subjectsContainer}>
                        {enrolledSubjects.slice(0, 3).map((subject) => (
                            <View key={subject.subject_id} style={styles.subjectCard}>
                                <Text style={styles.subjectName}>{subject.subject_name}</Text>
                                <Text style={styles.subjectCode}>{subject.subject_code}</Text>
                                <View style={styles.subjectGradeContainer}>
                                    <Text style={styles.subjectGrade}>
                                        {subject.grade !== 'Not Graded' ? subject.grade : 'N/A'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 20,
        paddingTop: 40,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    greeting: {
        color: colors.textMuted,
        fontSize: 14,
    },
    name: {
        color: colors.text,
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 4,
    },
    grade: {
        color: colors.textMuted,
        fontSize: 14,
        marginTop: 4,
    },
    logoutButton: {
        backgroundColor: colors.danger,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    logoutText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 20,
        gap: 10,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    statNumber: {
        color: colors.accent,
        fontSize: 28,
        fontWeight: 'bold',
    },
    statLabel: {
        color: colors.textMuted,
        fontSize: 12,
        marginTop: 4,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 18,
        fontWeight: 'bold',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
    },
    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 12,
    },
    actionCard: {
        flex: 1,
        minWidth: '40%',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    actionIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    actionLabel: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '500',
    },
    subjectsContainer: {
        paddingHorizontal: 20,
        gap: 10,
    },
    subjectCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    subjectName: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    subjectCode: {
        color: colors.textMuted,
        fontSize: 12,
        marginRight: 12,
    },
    subjectGradeContainer: {
        backgroundColor: colors.accent,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    subjectGrade: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    errorText: {
        color: colors.danger,
        fontSize: 18,
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: colors.accent,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default DashboardScreen;