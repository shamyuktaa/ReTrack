using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReTrackV1.Migrations
{
    public partial class AddProductCategoryToReturns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BagItems_Bags_BagId",
                table: "BagItems");

            migrationBuilder.DropForeignKey(
                name: "FK_IssueReports_Bags_BagsId",
                table: "IssueReports");

            migrationBuilder.DropForeignKey(
                name: "FK_Returns_Bags_BagsId",
                table: "Returns");

            migrationBuilder.DropForeignKey(
                name: "FK_Returns_Products_ProductId",
                table: "Returns");

            migrationBuilder.DropIndex(
                name: "IX_Returns_BagsId",
                table: "Returns");

            migrationBuilder.DropIndex(
                name: "IX_IssueReports_BagsId",
                table: "IssueReports");

            migrationBuilder.DropIndex(
                name: "IX_BagItems_ReturnId",
                table: "BagItems");

            migrationBuilder.DropColumn(
                name: "BagsId",
                table: "Returns");

            migrationBuilder.DropColumn(
                name: "BagsId",
                table: "IssueReports");

            // ❌ REMOVED — column already exists in DB
            // migrationBuilder.AddColumn<string>(
            //     name: "ProductCategory",
            //     table: "Returns",
            //     type: "nvarchar(max)",
            //     nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "BagItems",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true);

           

            migrationBuilder.AlterColumn<string>(
                name: "Expected",
                table: "BagItems",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "BagId",
                table: "BagItems",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_BagItems_ReturnId",
                table: "BagItems",
                column: "ReturnId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_BagItems_Bags_BagId",
                table: "BagItems",
                column: "BagId",
                principalTable: "Bags",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Returns_Products_ProductId",
                table: "Returns",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BagItems_Bags_BagId",
                table: "BagItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Returns_Products_ProductId",
                table: "Returns");

            migrationBuilder.DropIndex(
                name: "IX_BagItems_ReturnId",
                table: "BagItems");

            // ❌ REMOVED — do NOT drop existing DB column
            // migrationBuilder.DropColumn(
            //     name: "ProductCategory",
            //     table: "Returns");

            migrationBuilder.AddColumn<int>(
                name: "BagsId",
                table: "Returns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BagsId",
                table: "IssueReports",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "BagItems",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

    

            migrationBuilder.AlterColumn<string>(
                name: "Expected",
                table: "BagItems",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "BagId",
                table: "BagItems",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.CreateIndex(
                name: "IX_Returns_BagsId",
                table: "Returns",
                column: "BagsId");

            migrationBuilder.CreateIndex(
                name: "IX_IssueReports_BagsId",
                table: "IssueReports",
                column: "BagsId");

            migrationBuilder.CreateIndex(
                name: "IX_BagItems_ReturnId",
                table: "BagItems",
                column: "ReturnId",
                unique: true,
                filter: "[ReturnId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_BagItems_Bags_BagId",
                table: "BagItems",
                column: "BagId",
                principalTable: "Bags",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_IssueReports_Bags_BagsId",
                table: "IssueReports",
                column: "BagsId",
                principalTable: "Bags",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Returns_Bags_BagsId",
                table: "Returns",
                column: "BagsId",
                principalTable: "Bags",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Returns_Products_ProductId",
                table: "Returns",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id");
        }
    }
}
