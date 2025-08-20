using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixSavingsGoalForeignKeyConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add the foreign key constraint that was skipped in the previous migration
            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_SavingsGoals_SavingsGoalId",
                table: "Expenses",
                column: "SavingsGoalId",
                principalTable: "SavingsGoals",
                principalColumn: "SavingsGoalId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_SavingsGoals_SavingsGoalId",
                table: "Expenses");

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_SavingsGoals_SavingsGoalId",
                table: "Expenses",
                column: "SavingsGoalId",
                principalTable: "SavingsGoals",
                principalColumn: "SavingsGoalId",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
