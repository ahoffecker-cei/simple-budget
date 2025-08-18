import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryColorIconPickerComponent } from './category-color-icon-picker.component';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@simple-budget/shared';

describe('CategoryColorIconPickerComponent', () => {
  let component: CategoryColorIconPickerComponent;
  let fixture: ComponentFixture<CategoryColorIconPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryColorIconPickerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CategoryColorIconPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.value.colorId).toBe('blue');
    expect(component.value.iconId).toBe('home');
  });

  it('should have 30 colors available', () => {
    expect(component.colors).toEqual(CATEGORY_COLORS);
    expect(component.colors.length).toBe(30);
  });

  it('should have 30 icons available', () => {
    expect(component.icons).toEqual(CATEGORY_ICONS);
    expect(component.icons.length).toBe(30);
  });

  it('should find selected color correctly', () => {
    component.value = { colorId: 'red', iconId: 'home' };
    const selectedColor = component.selectedColor;
    expect(selectedColor?.id).toBe('red');
    expect(selectedColor?.name).toBe('Red');
  });

  it('should find selected icon correctly', () => {
    component.value = { colorId: 'blue', iconId: 'restaurant' };
    const selectedIcon = component.selectedIcon;
    expect(selectedIcon?.id).toBe('restaurant');
    expect(selectedIcon?.materialIcon).toBe('restaurant');
  });

  it('should update color when selectColor is called', () => {
    const onChangeSpy = jasmine.createSpy('onChange');
    const onTouchedSpy = jasmine.createSpy('onTouched');
    
    component.registerOnChange(onChangeSpy);
    component.registerOnTouched(onTouchedSpy);
    
    component.selectColor('purple');
    
    expect(component.value.colorId).toBe('purple');
    expect(onChangeSpy).toHaveBeenCalledWith({ colorId: 'purple', iconId: 'home' });
    expect(onTouchedSpy).toHaveBeenCalled();
  });

  it('should update icon when selectIcon is called', () => {
    const onChangeSpy = jasmine.createSpy('onChange');
    const onTouchedSpy = jasmine.createSpy('onTouched');
    
    component.registerOnChange(onChangeSpy);
    component.registerOnTouched(onTouchedSpy);
    
    component.selectIcon('car');
    
    expect(component.value.iconId).toBe('car');
    expect(onChangeSpy).toHaveBeenCalledWith({ colorId: 'blue', iconId: 'car' });
    expect(onTouchedSpy).toHaveBeenCalled();
  });

  it('should write value correctly', () => {
    const newValue = { colorId: 'green', iconId: 'fitness_center' };
    component.writeValue(newValue);
    
    expect(component.value).toEqual(newValue);
  });

  it('should handle null writeValue', () => {
    const originalValue = component.value;
    component.writeValue(null as any);
    
    expect(component.value).toEqual(originalValue);
  });
});