import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from '@modules/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { RoleModule } from '@modules/role/role.module';
import { BranchModule } from '@modules/branch/branch.module';
import { StaffModule } from '@modules/staff/staff.module';
import { CategoryModule } from '@modules/category/category.module';
import { MenuModule } from '@modules/menu/menu.module';
import { MenusModule } from '@modules/menus/menus.module';
import { FoodTypeModule } from '@modules/food-type/food-type.module';
import { AreaModule } from '@modules/area/area.module';
import { TableModule } from '@modules/table/table.module';
import { QrCodeModule } from '@modules/qr-code/qr-code.module';
import { OrderModule } from '@modules/order/order.module';
import { CustomerModule } from '@modules/customer/customer.module';
import { RolePermissionModule } from '@modules/role-permission/role-permission.module';
import { SettingModule } from '@modules/setting/setting.module';
import { CurrencyModule } from '@modules/currency/currency.module';
import { TaxModule } from '@modules/tax/tax.module';
import { LanguageModule } from '@modules/language/language.module';
import { TranslationModule } from '@modules/translation/translation.module';
import { KioskMachineModule } from '@modules/kiosk-machine/kiosk-machine.module';
import { AnalyticsModule } from '@modules/analytics/analytics.module';
import { TimeSlotModule } from '@modules/time-slot/time-slot.module';
import { RegisterModule } from '@modules/register/register.module';
import { TransactionModule } from '@modules/transaction/transaction.module';
import { ReportModule } from '@modules/report/report.module';
import { IncomeModule } from '@modules/income/income.module';
import { ExpenseModule } from '@modules/expense/expense.module';
import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { FileManagerModule } from '@modules/file-manager/file-manager.module';
import { ResponseModule } from '@cor/filters/exceptions/response.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    PermissionsModule,
    ResponseModule,
    RoleModule,
    BranchModule,
    StaffModule,
    CategoryModule,
    MenuModule,
    MenusModule,
    FoodTypeModule,
    AreaModule,
    TableModule,
    QrCodeModule,
    OrderModule,
    CustomerModule,
    RolePermissionModule,
    SettingModule,
    CurrencyModule,
    TaxModule,
    LanguageModule,
    TranslationModule,
    KioskMachineModule,
    AnalyticsModule,
    TimeSlotModule,
    RegisterModule,
    TransactionModule,
    ReportModule,
    IncomeModule,
    ExpenseModule,
    PaginationModule,
    FileManagerModule,
  ],
  exports: [
    UserModule,
    AuthModule,
    PermissionsModule,
    ResponseModule,
    RoleModule,
    PaginationModule,
    FileManagerModule,
  ],
})
export class AppModules {}
