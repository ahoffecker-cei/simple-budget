using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Data.Migrations
{
    /// <inheritdoc />
    public partial class SetDefaultColorAndIconValues : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update existing categories with default color and icon values
            migrationBuilder.Sql("UPDATE [BudgetCategories] SET [ColorId] = 'blue' WHERE [ColorId] = ''");
            migrationBuilder.Sql("UPDATE [BudgetCategories] SET [IconId] = 'home' WHERE [IconId] = ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
