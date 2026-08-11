import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '@cor/decorators/auth/current-user.decorator';
import { AuthenticatedUser } from '@modules/auth/strategies/jwt.strategy';

import { InventoryService } from './inventory.service';
import { RecipeService } from './recipe.service';
import { StockTakeService } from './stock-take.service';
import { InventoryReportService } from './inventory-report.service';
import {
  AdjustStockDto,
  CreateStockItemDto,
  CreateStockTakeDto,
  GetInventoryReportQueryDto,
  GetStockItemQueryDto,
  GetStockTakeQueryDto,
  SetRecipeDto,
  UpdateStockItemDto,
  UpdateStockTakeDto,
} from './dto';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly _inventory: InventoryService,
    private readonly _recipes: RecipeService,
    private readonly _stockTakes: StockTakeService,
    private readonly _reports: InventoryReportService,
  ) {}

  // ---- Reports -----------------------------------------------------------

  @Get('reports')
  report(@Query() query: GetInventoryReportQueryDto) {
    return this._reports.getReport(query);
  }

  // ---- Stock takes -------------------------------------------------------

  @Get('stock-takes')
  listTakes(@Query() query: GetStockTakeQueryDto) {
    return this._stockTakes.getAll(query);
  }

  @Get('stock-takes/:id')
  getTake(@Param('id', ParseUUIDPipe) id: string) {
    return this._stockTakes.getById(id);
  }

  @Post('stock-takes')
  createTake(
    @Body() dto: CreateStockTakeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this._stockTakes.create(dto, user?.id ?? null);
  }

  @Put('stock-takes/:id')
  updateTake(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockTakeDto,
  ) {
    return this._stockTakes.update(id, dto);
  }

  @Post('stock-takes/:id/complete')
  completeTake(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this._stockTakes.complete(id, user?.id ?? null);
  }

  @Post('stock-takes/:id/cancel')
  cancelTake(@Param('id', ParseUUIDPipe) id: string) {
    return this._stockTakes.cancel(id);
  }

  @Delete('stock-takes/:id')
  removeTake(@Param('id', ParseUUIDPipe) id: string) {
    return this._stockTakes.remove(id);
  }

  // ---- Stock catalogue ---------------------------------------------------

  @Get('stock-items')
  list(@Query() query: GetStockItemQueryDto) {
    return this._inventory.getAll(query);
  }

  @Get('stock-items/:id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._inventory.getById(id);
  }

  @Post('stock-items')
  create(@Body() dto: CreateStockItemDto) {
    return this._inventory.create(dto);
  }

  @Put('stock-items/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockItemDto,
  ) {
    return this._inventory.update(id, dto);
  }

  @Delete('stock-items/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this._inventory.remove(id);
  }

  // ---- Levels + ledger ---------------------------------------------------

  @Get('levels')
  levels(@Query('branchId', ParseUUIDPipe) branchId: string) {
    return this._inventory.levelsForBranch(branchId);
  }

  @Get('movements')
  movements(@Query() query: GetStockItemQueryDto & { stockItemId?: string }) {
    return this._inventory.getMovements(query);
  }

  @Post('adjust')
  adjust(@Body() dto: AdjustStockDto, @CurrentUser() user: AuthenticatedUser) {
    return this._inventory.adjust(dto, user?.id ?? null);
  }

  // ---- Recipes -----------------------------------------------------------

  @Get('recipe/:menuItemId')
  getRecipe(@Param('menuItemId', ParseUUIDPipe) menuItemId: string) {
    return this._recipes.getRecipe(menuItemId);
  }

  @Put('recipe/:menuItemId')
  setRecipe(
    @Param('menuItemId', ParseUUIDPipe) menuItemId: string,
    @Body() dto: SetRecipeDto,
  ) {
    return this._recipes.setRecipe(menuItemId, dto);
  }
}
