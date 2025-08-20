using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIncomeSourceAndSavingsGoal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SavingsGoalId",
                table: "Expenses",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "IncomeSources",
                columns: table => new
                {
                    IncomeSourceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Frequency = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncomeSources", x => x.IncomeSourceId);
                    table.ForeignKey(
                        name: "FK_IncomeSources_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SavingsGoals",
                columns: table => new
                {
                    SavingsGoalId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TargetAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CurrentProgress = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavingsGoals", x => x.SavingsGoalId);
                    table.ForeignKey(
                        name: "FK_SavingsGoals_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_SavingsGoalId",
                table: "Expenses",
                column: "SavingsGoalId");

            migrationBuilder.CreateIndex(
                name: "IX_IncomeSources_UserId_Name",
                table: "IncomeSources",
                columns: new[] { "UserId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SavingsGoals_UserId_Name",
                table: "SavingsGoals",
                columns: new[] { "UserId", "Name" },
                unique: true);

            // Note: Foreign key constraint will be added in the next migration
            // to avoid SQL Server cascade path conflicts
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Note: No foreign key to drop since it wasn't created in this migration

            migrationBuilder.DropTable(
                name: "IncomeSources");

            migrationBuilder.DropTable(
                name: "SavingsGoals");

            migrationBuilder.DropIndex(
                name: "IX_Expenses_SavingsGoalId",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "SavingsGoalId",
                table: "Expenses");
        }
    }
}
